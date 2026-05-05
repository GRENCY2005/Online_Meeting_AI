"use client"

import { useUser } from '@clerk/nextjs';
import React, { useEffect, useRef, useState } from 'react'
import MeetingRoom from '@/components/MeetingRoom';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mic, MicOff, Video, VideoOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

/**
 * PreJoin Component
 * Handles the setup before entering the meeting room.
 */
const PreJoin = ({
  setIsSetupComplete,
  displayName,
  setDisplayName,
  isMicOn,
  setIsMicOn,
  isCamOn,
  setIsCamOn
}: {
  setIsSetupComplete: (val: boolean) => void;
  displayName: string;
  setDisplayName: (val: string) => void;
  isMicOn: boolean;
  setIsMicOn: (val: boolean) => void;
  isCamOn: boolean;
  setIsCamOn: (val: boolean) => void;
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    let activeStream: MediaStream | null = null;

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      toast.error("Camera/mic blocked — open the app at http://localhost:3000 (not an IP address)", { duration: 8000 });
      return;
    }

    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((s) => {
        activeStream = s;
        setStream(s);
        if (videoRef.current) {
          videoRef.current.srcObject = s;
        }
      })
      .catch((err) => {
        toast.error("Failed to access camera and microphone: " + err.message);
      });

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    if (stream) {
      stream.getAudioTracks().forEach(track => track.enabled = isMicOn);
      stream.getVideoTracks().forEach(track => track.enabled = isCamOn);
    }
  }, [stream, isMicOn, isCamOn]);

  const handleJoin = () => {
    if (!displayName.trim()) {
      toast.error("Please enter your name to join");
      return;
    }
    // Clean up local preview stream before joining so useWebRTC can acquire it
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    setIsSetupComplete(true);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
      <div className="w-full max-w-[900px] grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        
        {/* Left Side: Video Preview */}
        <div className="relative group rounded-2xl overflow-hidden border border-gray-700 bg-gray-900 shadow-2xl aspect-video flex items-center justify-center">
          {stream ? (
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className={`w-full h-full object-cover transition-opacity ${!isCamOn ? 'opacity-0' : 'opacity-100'}`}
            />
          ) : (
            <div className="text-gray-500 flex flex-col items-center">
              <Loader2 className="animate-spin h-8 w-8 mb-2" />
              <p>Requesting camera access...</p>
            </div>
          )}

          {!isCamOn && stream && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
              <div className="h-24 w-24 rounded-full bg-blue-600 flex items-center justify-center text-4xl font-bold uppercase">
                {displayName.charAt(0) || '?'}
              </div>
            </div>
          )}

          {/* Floating Controls Over Video */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4 transition-opacity duration-300">
            <button
              onClick={() => setIsMicOn(!isMicOn)}
              className={`p-3 rounded-full transition-all ${isMicOn ? 'bg-gray-800 hover:bg-gray-700' : 'bg-red-500 hover:bg-red-600'}`}
            >
              {isMicOn ? <Mic size={24} /> : <MicOff size={24} />}
            </button>
            <button
              onClick={() => setIsCamOn(!isCamOn)}
              className={`p-3 rounded-full transition-all ${isCamOn ? 'bg-gray-800 hover:bg-gray-700' : 'bg-red-500 hover:bg-red-600'}`}
            >
              {isCamOn ? <Video size={24} /> : <VideoOff size={24} />}
            </button>
          </div>
        </div>

        {/* Right Side: Welcome & Action */}
        <div className="flex flex-col gap-6 p-4">
          <div className="space-y-2 text-center md:text-left">
            <h1 className="text-4xl font-bold tracking-tight">Ready to join?</h1>
            <p className="text-gray-400">Set up your audio and video before entering the meeting.</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300 ml-1">Your Display Name</label>
              <Input
                placeholder="Enter your name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white h-12 focus:ring-blue-500 rounded-xl"
              />
            </div>

            <Button
              onClick={handleJoin}
              disabled={!displayName.trim()}
              className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-lg shadow-lg hover:shadow-blue-500/20 active:scale-[0.98] transition-all"
            >
              Join Meeting
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

const Meeting = () => {
  const { id } = useParams();
  const { user, isLoaded } = useUser();
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCamOn, setIsCamOn] = useState(true);

  const [callStatus, setCallStatus] = useState<'loading' | 'allowed' | 'early'>('loading');
  const [scheduledTime, setScheduledTime] = useState<Date | null>(null);

  useEffect(() => {
    const checkMeeting = async () => {
      try {
        const res = await fetch(`http://localhost:3001/api/meetings/${id}`);
        if (res.ok) {
           const meeting = await res.json();
           if (meeting.dateTime) {
              const dt = new Date(meeting.dateTime);
              if (dt > new Date()) {
                 setScheduledTime(dt);
                 setCallStatus('early');
                 return;
              }
           }
        }
      } catch (err) {
         console.error('Failed to fetch meeting info:', err);
      }
      setCallStatus('allowed');
    };
    if (id) {
        checkMeeting();
    }
  }, [id]);

  useEffect(() => {
    if (user) {
      setDisplayName(user.fullName || user.username || '');
    }
  }, [user]);

  if (!isLoaded || callStatus === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <Loader2 className="animate-spin h-10 w-10 text-blue-500" />
      </div>
    );
  }

  if (callStatus === 'early' && scheduledTime) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 max-w-md text-center shadow-2xl">
             <h2 className="text-2xl font-bold mb-4">Meeting hasn't started yet</h2>
             <p className="text-gray-400 mb-6">This meeting is scheduled for {scheduledTime.toLocaleString()}. Please return at the scheduled time.</p>
             <Button onClick={() => window.location.href = '/'} className="bg-blue-600 hover:bg-blue-700">
                 Return Home
             </Button>
          </div>
      </div>
    );
  }

  return (
    <main className="h-screen w-full bg-gray-900">
      {!isSetupComplete ? (
        <PreJoin
          setIsSetupComplete={setIsSetupComplete}
          displayName={displayName}
          setDisplayName={setDisplayName}
          isMicOn={isMicOn}
          setIsMicOn={setIsMicOn}
          isCamOn={isCamOn}
          setIsCamOn={setIsCamOn}
        />
      ) : (
        <MeetingRoom 
          meetingId={id as string} 
          userId={user?.id || `guest-${Date.now()}`}
          userName={displayName}
          initialMicOn={isMicOn}
          initialCamOn={isCamOn}
        />
      )}
    </main>
  );
};

export default Meeting;
