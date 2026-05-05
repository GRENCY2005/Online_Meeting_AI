const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
app.use(cors());
app.use(express.json());

const connectDB = require('./db');
const Meeting = require('./models/Meeting');
const Transcript = require('./models/Transcript');
const Summary = require('./models/Summary');
const GoogleToken = require('./models/GoogleToken');
const { getAuthUrl, exchangeCodeForTokens, getAuthedClient, scheduleActionItems } = require('./services/googleCalendar');

// Initialize MongoDB connection
connectDB();

const { generateSummary } = require('./services/summaryService');

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Adjust for production
    methods: ["GET", "POST"]
  }
});

// socketId -> { userId, userName, roomId }
const users = new Map();

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // When a user joins the room
  socket.on('join-room', ({ roomId, userId, userName }) => {
    socket.join(roomId);
    users.set(socket.id, { userId, userName, roomId });
    
    console.log(`User ${userName} (${userId}) joined room ${roomId}`);

    // Notify others in the room
    socket.to(roomId).emit('user-joined', { userId, userName, socketId: socket.id });

    // Send the list of existing users to the newly joined user
    const existingUsers = [];
    users.forEach((user, id) => {
      if (user.roomId === roomId && id !== socket.id) {
        existingUsers.push({ ...user, socketId: id });
      }
    });
    socket.emit('existing-users', existingUsers);
  });

  // WebRTC Signaling: Offer
  socket.on('offer', ({ targetSocketId, offer, callerId, callerName }) => {
    io.to(targetSocketId).emit('offer', {
      offer,
      callerId,
      callerName,
      socketId: socket.id
    });
  });

  // WebRTC Signaling: Answer
  socket.on('answer', ({ targetSocketId, answer }) => {
    io.to(targetSocketId).emit('answer', {
      answer,
      socketId: socket.id
    });
  });

  // WebRTC Signaling: ICE Candidate
  socket.on('ice-candidate', ({ targetSocketId, candidate }) => {
    io.to(targetSocketId).emit('ice-candidate', {
      candidate,
      socketId: socket.id
    });
  });

  // Web Speech API Relay
  socket.on('transcript', async (data) => {
    // 1. Maintain existing broadcast behavior completely unchanged
    io.to(data.meetingId).emit('transcript', data);

    // 2. Asynchronously store the transcript segment in MongoDB
    if (mongoose.connection.readyState !== 1) return;
    
    try {
      if (data.meetingId) {
        // Ensure meeting exists
        await Meeting.findOneAndUpdate(
          { meetingId: data.meetingId },
          { $setOnInsert: { meetingId: data.meetingId } },
          { upsert: true }
        );

        // Format the incoming text
        const speakerName = data.speakerName || data.userName || data.speaker || "Unknown";
        const incomingText = data.text || data.transcriptText || data.transcript || "";
        const appendedText = `${speakerName}: ${incomingText}\n`;

        const newSegment = {
          speakerId: data.speakerId || data.userId || null,
          speakerName: speakerName,
          transcriptText: incomingText,
          timestamp: data.timestamp ? new Date(data.timestamp) : new Date()
        };

        // Atomic upsert — no race condition when two speakers talk simultaneously
        await Transcript.findOneAndUpdate(
          { meetingId: data.meetingId },
          [
            {
              $set: {
                meetingId: data.meetingId,
                transcript: {
                  $concat: [{ $ifNull: ['$transcript', ''] }, appendedText]
                },
                segments: {
                  $concatArrays: [{ $ifNull: ['$segments', []] }, [newSegment]]
                },
                updatedAt: new Date()
              }
            }
          ],
          { upsert: true }
        );
      }
    } catch (dbError) {
      console.error("Failed to dynamically save transcript to DB:", dbError);
    }
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    const user = users.get(socket.id);
    if (user) {
      io.to(user.roomId).emit('user-left', { socketId: socket.id });
      users.delete(socket.id);
    }
  });
});

// Fallback in-memory array for when MongoDB is disconnected
const fallbackMeetings = [];

// REST API logic for Scheduled Meetings
app.post('/api/meetings', async (req, res) => {
  try {
    const { meetingId, description, dateTime, createdBy } = req.body;
    if (!meetingId) {
      return res.status(400).json({ error: "meetingId is required" });
    }
    
    if (mongoose.connection.readyState !== 1) {
       console.log("MongoDB not connected, using in-memory fallback for meeting creation");
       const meeting = { meetingId, description, dateTime, createdBy, createdAt: new Date() };
       fallbackMeetings.push(meeting);
       return res.status(201).json(meeting);
    }

    const newMeeting = await Meeting.create({
      meetingId,
      description,
      dateTime,
      createdBy
    });
    
    return res.status(201).json(newMeeting);
  } catch (error) {
    if (error.code === 11000) {
       return res.status(409).json({ error: "Meeting already exists" });
    }
    console.error("Error creating meeting:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.get('/api/meetings', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
        return res.json(fallbackMeetings.filter(m => m.dateTime).sort((a,b) => new Date(a.dateTime) - new Date(b.dateTime)));
    }
    const meetings = await Meeting.find({ dateTime: { $exists: true } }).sort({ dateTime: 1 });
    return res.json([...fallbackMeetings, ...meetings]); 
  } catch (error) {
    console.error("Error fetching meetings:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.get('/api/meetings/:id', async (req, res) => {
  try {
    const fallback = fallbackMeetings.find(m => m.meetingId === req.params.id);
    if (fallback) return res.json(fallback);

    if (mongoose.connection.readyState !== 1) {
        return res.status(404).json({ error: "Meeting not found" });
    }
    const meeting = await Meeting.findOne({ meetingId: req.params.id });
    if (!meeting) {
      return res.status(404).json({ error: "Meeting not found" });
    }
    return res.json(meeting);
  } catch (error) {
    console.error("Error fetching meeting:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.post('/api/meeting/generate-summary', async (req, res) => {
  try {
    const { transcript, meetingId } = req.body;
    
    if (!transcript) {
      return res.status(400).json({ error: "Transcript is required" });
    }

    // Call summaryService
    const summaryData = await generateSummary(transcript);
    
    // Upsert — overwrites any previous summary for this meeting instead of creating duplicates
    if (mongoose.connection.readyState === 1) {
      try {
        await Summary.findOneAndUpdate(
          { meetingId: meetingId || "offline-meeting" },
          {
            $set: {
              fullTranscript: transcript,
              summary: summaryData.summary || "",
              keyPoints: summaryData.key_points || [],
              actionItems: summaryData.action_items || [],
              decisions: summaryData.decisions || [],
              updatedAt: new Date()
            }
          },
          { upsert: true }
        );
      } catch (err) {
        if (err.code !== 11000) { // ignore duplicate key — upsert race is harmless
          console.error("Failed to save summary to MongoDB:", err);
        }
      }
    }
    
    return res.json(summaryData);

  } catch (err) {
    console.error("Groq API Error:", err);
    res.status(500).json({ error: "Failed to generate summary. Please try again later." });
  }
});

// ── Google Calendar ───────────────────────────────────────────────────────

// 1. Start OAuth flow — redirect user to Google consent screen
app.get('/api/google/auth', (req, res) => {
  const userId = req.query.userId;
  if (!userId) return res.status(400).json({ error: 'userId required' });
  if (!process.env.GOOGLE_CLIENT_ID) return res.status(503).json({ error: 'Google Calendar not configured' });
  res.redirect(getAuthUrl(userId));
});

// 2. OAuth callback — exchange code for tokens, store in DB, redirect to frontend
app.get('/api/google/callback', async (req, res) => {
  const { code, state } = req.query;
  if (!code || !state) return res.status(400).send('Missing OAuth params');

  try {
    const userId = Buffer.from(state, 'base64').toString('utf8');
    const { tokens, email } = await exchangeCodeForTokens(code);

    await GoogleToken.findOneAndUpdate(
      { userId },
      {
        accessToken:  tokens.access_token,
        refreshToken: tokens.refresh_token,
        tokenExpiry:  tokens.expiry_date ? new Date(tokens.expiry_date) : null,
        email
      },
      { upsert: true, new: true }
    );

    const frontend = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontend}/schedule?google=connected`);
  } catch (err) {
    console.error('Google OAuth callback error:', err);
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/schedule?google=error`);
  }
});

// 3. Check if a user has connected Google Calendar
app.get('/api/google/status/:userId', async (req, res) => {
  try {
    const token = await GoogleToken.findOne({ userId: req.params.userId });
    return res.json({ connected: !!token, email: token?.email || null });
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// 4. Schedule action items from a meeting recap into Google Calendar
app.post('/api/google/schedule/:meetingId', async (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId required' });

  try {
    const storedToken = await GoogleToken.findOne({ userId });
    if (!storedToken) return res.status(403).json({ error: 'Google Calendar not connected' });

    const summary = await Summary.findOne({ meetingId: req.params.meetingId });
    if (!summary) return res.status(404).json({ error: 'No recap found for this meeting' });

    if (!summary.actionItems || summary.actionItems.length === 0)
      return res.status(400).json({ error: 'No action items to schedule' });

    // Get (and optionally refresh) the auth client
    const { client, newTokens } = await getAuthedClient(storedToken);
    if (newTokens) {
      await GoogleToken.findOneAndUpdate(
        { userId },
        {
          accessToken: newTokens.access_token,
          ...(newTokens.refresh_token && { refreshToken: newTokens.refresh_token }),
          ...(newTokens.expiry_date  && { tokenExpiry: new Date(newTokens.expiry_date) })
        }
      );
    }

    const meeting = await Meeting.findOne({ meetingId: req.params.meetingId });
    const results = await scheduleActionItems(client, {
      actionItems:        summary.actionItems,
      meetingId:          req.params.meetingId,
      meetingDate:        summary.createdAt?.toISOString(),
      meetingDescription: meeting?.description || null
    });

    // Persist successful event IDs into the Summary document
    const successfulEvents = results.filter(r => r.eventId);
    if (successfulEvents.length > 0) {
      await Summary.findOneAndUpdate(
        { meetingId: req.params.meetingId },
        { $push: { scheduledEvents: { $each: successfulEvents } } }
      );
    }

    return res.json({ scheduled: successfulEvents, failed: results.filter(r => r.error) });
  } catch (err) {
    console.error('Schedule error:', err);
    return res.status(500).json({ error: err.message || 'Failed to schedule events' });
  }
});

// Meeting Recaps — list all summaries with optional meeting metadata
app.get('/api/recaps', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) return res.json([]);
    const summaries = await Summary.find({}).sort({ createdAt: -1 }).lean();
    const result = await Promise.all(
      summaries.map(async (s) => {
        const meeting = await Meeting.findOne({ meetingId: s.meetingId }).lean();
        return {
          ...s,
          description: meeting?.description || null,
          scheduledAt: meeting?.dateTime || null,
        };
      })
    );
    return res.json(result);
  } catch (err) {
    console.error("Error fetching recaps:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Single recap by meetingId
app.get('/api/recaps/:meetingId', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1)
      return res.status(503).json({ error: "Database not connected" });
    const summary = await Summary.findOne({ meetingId: req.params.meetingId }).lean();
    if (!summary) return res.status(404).json({ error: "Recap not found" });
    const meeting = await Meeting.findOne({ meetingId: req.params.meetingId }).lean();
    return res.json({
      ...summary,
      description: meeting?.description || null,
      scheduledAt: meeting?.dateTime || null,
    });
  } catch (err) {
    console.error("Error fetching recap:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`Signaling server listening on port ${PORT}`);
});
