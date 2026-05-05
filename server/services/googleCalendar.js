require('dotenv').config();
const { google } = require('googleapis');
const Groq = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ── OAuth2 client factory ──────────────────────────────────────────────────
function createOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}

// Build the URL that sends the user to Google's consent screen
function getAuthUrl(userId) {
  const oauth2Client = createOAuth2Client();
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',          // forces refresh_token to be issued every time
    scope: [
      'https://www.googleapis.com/auth/calendar',        // includes events + freebusy
      'https://www.googleapis.com/auth/userinfo.email',
    ],
    state: Buffer.from(userId).toString('base64')
  });
}

// Exchange auth code → tokens, return { tokens, email }
async function exchangeCodeForTokens(code) {
  const oauth2Client = createOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);

  // Get the user's Google email
  const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
  const { data } = await oauth2.userinfo.get();

  return { tokens, email: data.email };
}

// Build an OAuth2 client from stored tokens, auto-refreshing if expired
async function getAuthedClient(storedToken) {
  const oauth2Client = createOAuth2Client();
  oauth2Client.setCredentials({
    access_token:  storedToken.accessToken,
    refresh_token: storedToken.refreshToken,
    expiry_date:   storedToken.tokenExpiry ? new Date(storedToken.tokenExpiry).getTime() : undefined
  });

  // If token is expired or about to expire (< 5 min), refresh it
  if (storedToken.tokenExpiry && new Date(storedToken.tokenExpiry) < new Date(Date.now() + 5 * 60 * 1000)) {
    const { credentials } = await oauth2Client.refreshAccessToken();
    oauth2Client.setCredentials(credentials);
    // Return updated tokens so caller can persist them
    return { client: oauth2Client, newTokens: credentials };
  }

  return { client: oauth2Client, newTokens: null };
}

// ── Deadline + priority parsing via Groq ──────────────────────────────────
async function parseActionItem(actionItemText, meetingDateISO) {
  const today = new Date().toISOString().split('T')[0];
  const meetingDate = meetingDateISO ? meetingDateISO.split('T')[0] : today;

  const prompt = `You are a scheduling assistant. Analyze this meeting action item and extract scheduling information.

Meeting date: ${meetingDate}
Today: ${today}
Action item: "${actionItemText}"

Return ONLY valid JSON in this exact format:
{
  "title": "short calendar event title (max 55 chars)",
  "deadline": "YYYY-MM-DD or null",
  "priority": "high | medium | low",
  "duration_hours": 1
}

Priority rules:
- high   → urgent/ASAP/critical/today/tomorrow/this week
- medium → within 2 weeks, next sprint, soon
- low    → eventually/when possible/no urgency

Deadline rules:
- Convert relative dates (e.g. "by Friday", "end of month") to absolute YYYY-MM-DD based on today (${today}).
- If no deadline is mentioned, return null.

Duration rules: estimate realistic hours (1–4 for most tasks, up to 8 for major deliverables).`;

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: 'You extract scheduling data from action items. Return only valid JSON, nothing else.' },
        { role: 'user',   content: prompt }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.1,
      response_format: { type: 'json_object' }
    });
    return JSON.parse(completion.choices[0].message.content);
  } catch {
    // Safe fallback if Groq call fails
    return { title: actionItemText.slice(0, 55), deadline: null, priority: 'medium', duration_hours: 1 };
  }
}

// ── Format a Date as "YYYY-MM-DDTHH:mm:ss" (no Z / no offset) ────────────
// Used so Google Calendar interprets the time in the supplied timeZone field
// rather than treating it as UTC.
function toLocalDTString(date) {
  const p = n => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${p(date.getMonth()+1)}-${p(date.getDate())}` +
         `T${p(date.getHours())}:${p(date.getMinutes())}:${p(date.getSeconds())}`;
}

// ── Slot builder — places event at 9 AM on the target date ───────────────
function findFreeSlot(_authClient, date, durationHours) {
  const tz = process.env.TIMEZONE || 'Asia/Kolkata';
  // Get the calendar date (YYYY-MM-DD) in the target timezone
  const localDate = date.toLocaleDateString('en-CA', { timeZone: tz }); // en-CA → YYYY-MM-DD
  // Build 9 AM as a plain local datetime (no timezone suffix)
  const start = new Date(`${localDate}T09:00:00`);
  const end   = new Date(start.getTime() + durationHours * 3600 * 1000);
  return Promise.resolve({ start, end });
}

// ── Compute event date from parsed info ───────────────────────────────────
function computeTargetDate(parsed, _meetingDateISO) {
  if (parsed.deadline) {
    const d = new Date(parsed.deadline);
    if (!isNaN(d.getTime())) return d;
  }
  // No explicit deadline — schedule by priority relative to today
  const base = new Date();
  const offsetDays = parsed.priority === 'high' ? 1 : parsed.priority === 'medium' ? 3 : 7;
  base.setDate(base.getDate() + offsetDays);
  return base;
}

// ── Google Calendar color IDs ─────────────────────────────────────────────
// 11 = Tomato (red), 5 = Banana (yellow), 2 = Sage (green)
const PRIORITY_COLOR = { high: '11', medium: '5', low: '2' };

// ── Create a single calendar event ───────────────────────────────────────
async function createCalendarEvent(authClient, { title, start, end, description, priority }) {
  const calendar = google.calendar({ version: 'v3', auth: authClient });
  const tz = process.env.TIMEZONE || 'Asia/Kolkata';

  const { data } = await calendar.events.insert({
    calendarId: 'primary',
    requestBody: {
      summary:     title,
      description: description || '',
      start: { dateTime: toLocalDTString(start), timeZone: tz },
      end:   { dateTime: toLocalDTString(end),   timeZone: tz },
      colorId: PRIORITY_COLOR[priority] || '5',
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email',  minutes: 24 * 60 },
          { method: 'popup',  minutes: 30 }
        ]
      }
    }
  });

  return { id: data.id, htmlLink: data.htmlLink };
}

// ── Main: schedule all action items for a meeting (parallel) ─────────────
async function scheduleActionItems(authClient, { actionItems, meetingId, meetingDate, meetingDescription }) {
  const scheduleOne = async (item) => {
    try {
      const parsed     = await parseActionItem(item, meetingDate);
      const targetDate = computeTargetDate(parsed, meetingDate);
      const slot       = await findFreeSlot(authClient, targetDate, parsed.duration_hours || 1);

      const description = `Meeting: ${meetingDescription || meetingId}\nOriginal action item: ${item}`;
      const event = await createCalendarEvent(authClient, {
        title:       parsed.title || item.slice(0, 55),
        start:       slot.start,
        end:         slot.end,
        description,
        priority:    parsed.priority
      });

      return {
        actionItem:    item,
        eventId:       event.id,
        eventLink:     event.htmlLink,
        title:         parsed.title || item.slice(0, 55),
        scheduledDate: slot.start,
        priority:      parsed.priority
      };
    } catch (err) {
      console.error(`Failed to schedule action item "${item}":`, err.message);
      return { actionItem: item, error: err.message };
    }
  };

  // Run all items in parallel — reduces total time from sum to max
  return Promise.all(actionItems.map(scheduleOne));
}

module.exports = {
  getAuthUrl,
  exchangeCodeForTokens,
  getAuthedClient,
  scheduleActionItems
};
