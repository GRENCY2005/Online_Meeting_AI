"use client"

import React, { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { useWebRTC } from '@/hooks/useWebRTC';
import { Mic, MicOff, VideoOff, Video, PhoneOff, Users, Copy, MessageSquareText, AlignLeft, X, FileText } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface MeetingRoomProps {
  meetingId: string;
  userId: string;
  userName: string;
  initialMicOn: boolean;
  initialCamOn: boolean;
}

const RemotePeer = ({ stream, userName }: { stream: MediaStream, userName: string }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hasVideo = stream.getVideoTracks().length > 0 && stream.getVideoTracks()[0].enabled;

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="relative w-full h-full bg-gray-900 rounded-2xl overflow-hidden border border-gray-800 shadow-xl flex items-center justify-center group">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className={cn("w-full h-full object-cover transition-opacity duration-300", hasVideo ? 'opacity-100' : 'opacity-0')}
      />
      {!hasVideo && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
          <div className="h-24 w-24 rounded-full bg-blue-600 flex items-center justify-center text-4xl font-bold uppercase text-white shadow-lg">
            {userName.charAt(0) || '?'}
          </div>
        </div>
      )}
      <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg text-white text-sm font-medium transition-all group-hover:bg-black/80">
        {userName}
      </div>
    </div>
  );
};

const MeetingRoom = ({ meetingId, userId, userName, initialMicOn, initialCamOn }: MeetingRoomProps) => {
  const router = useRouter();
  const [isMicOn, setIsMicOn] = useState(initialMicOn);
  const [isCamOn, setIsCamOn] = useState(initialCamOn);
  const [showCaptions, setShowCaptions] = useState(true);
  const [showTranscriptPanel, setShowTranscriptPanel] = useState(false);

  const { localStream, peers, captions, error } = useWebRTC(meetingId, userId, userName, isMicOn, isCamOn);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const captionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Auto-scroll captions
  useEffect(() => {
    if (captionRef.current) {
      captionRef.current.scrollTop = captionRef.current.scrollHeight;
    }
  }, [captions]);

  const handleCopyLink = async () => {
    const meetingUrl = window.location.href;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(meetingUrl);
      } else {
        const ta = document.createElement('textarea');
        ta.value = meetingUrl;
        ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0;pointer-events:none;';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      toast.success("Meeting link copied!");
    } catch (error) {
      toast.error("Copy failed — link: " + meetingUrl);
      console.error("Failed to copy:", error);
    }
  };

  const handleEndCall = () => {
    if (captions.length > 0) {
      sessionStorage.setItem('meeting-captions', JSON.stringify(captions));
      sessionStorage.setItem('meeting-id', meetingId);
    }
    router.push('/summary');
  };

  const handleSummarize = () => {
    if (captions.length > 0) {
      sessionStorage.setItem('meeting-captions', JSON.stringify(captions));
      sessionStorage.setItem('meeting-id', meetingId);
    }
    window.open('/summary', '_blank');
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#1c1c1c] text-white space-y-4">
        <h2 className="text-xl font-bold text-red-500">Connection Error</h2>
        <p>{error}</p>
        <button onClick={handleEndCall} className="px-6 py-2 bg-blue-600 rounded-xl hover:bg-blue-700">Go Home</button>
      </div>
    );
  }

  const peersList = Object.values(peers);
  const totalParticipants = peersList.length + 1;

  // Determine elegant grid layout based on participant count
  const gridClasses = cn(
    "grid gap-4 w-full h-full p-4 overflow-hidden",
    totalParticipants === 1 && "grid-cols-1 md:w-3/4 mx-auto",
    totalParticipants === 2 && "grid-cols-1 md:grid-cols-2",
    totalParticipants === 3 && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-2", // One will span 2 cols using flex basically
    totalParticipants >= 4 && "grid-cols-2 lg:grid-cols-3"
  );

  return (
    <section className='relative h-screen w-full overflow-hidden bg-[#111] font-sans flex flex-col'>
      {/* Top Header */}
      <div className="absolute top-0 left-0 right-0 z-20 flex justify-between items-center p-6 pointer-events-none">
        <div className="bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 pointer-events-auto">
          <p className="text-white text-sm font-medium tracking-wide">Meeting: {meetingId}</p>
        </div>
        <div className="bg-black/40 backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-2 border border-white/10 pointer-events-auto">
          <Users size={16} className="text-gray-300" />
          <span className="text-white text-sm font-medium">{totalParticipants}</span>
        </div>
      </div>

      {/* Main Grid Area */}
      <div className='flex-1 relative flex justify-center items-center py-20 overflow-auto'>
        <div className={gridClasses}>
          {/* Local Participant */}
          <div className="relative w-full h-full bg-gray-900 rounded-2xl overflow-hidden border border-gray-800 shadow-xl flex items-center justify-center group min-h-[250px]">
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className={cn("w-full h-full object-cover transition-opacity duration-300 transform scale-x-[-1]", isCamOn ? 'opacity-100' : 'opacity-0')}
            />
            {!isCamOn && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                <div className="h-24 w-24 rounded-full bg-blue-600 flex items-center justify-center text-4xl font-bold uppercase text-white shadow-lg">
                  {userName.charAt(0) || '?'}
                </div>
              </div>
            )}
            <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg text-white text-sm font-medium flex items-center gap-2">
              {userName} (You)
              {!isMicOn && <MicOff size={14} className="text-red-400" />}
            </div>
          </div>

          {/* Remote Participants */}
          {peersList.map((peer) => (
            <div key={peer.userId} className="min-h-[250px]">
              <RemotePeer stream={peer.stream} userName={peer.userName} />
            </div>
          ))}
        </div>
      </div>

      {/* Full Transcript Panel Sidebar */}
      {showTranscriptPanel && (
        <div className="absolute right-0 top-0 bottom-0 w-80 sm:w-96 bg-[#1a1a1a] border-l border-[#333] z-40 flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
          <div className="px-6 py-4 border-b border-[#333] flex justify-between items-center bg-[#111]">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <AlignLeft size={18} className="text-blue-500" />
              Full Transcript
            </h3>
            <button onClick={() => setShowTranscriptPanel(false)} className="text-gray-400 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-md">
               <X size={20} />
            </button>
          </div>
          <div className="p-6 flex-1 overflow-y-auto flex flex-col gap-4">
            {captions.length === 0 ? (
              <div className="text-gray-500 text-sm flex flex-col items-center justify-center h-full gap-2">
                <MessageSquareText size={32} className="opacity-50" />
                <p>No transcripts yet. Start speaking!</p>
              </div>
            ) : (
              captions.map((c, i) => (
                <div key={i} className="flex flex-col gap-1.5 animate-in fade-in zoom-in-95 duration-200">
                  <div className="flex justify-between items-end">
                    <span className="text-[#1da1f2] font-semibold text-sm drop-shadow-sm">{c.speaker}</span>
                    {c.timestamp && <span className="text-[11px] text-gray-500 font-medium">{new Date(c.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}
                  </div>
                  <p className="text-gray-200 text-[15px] leading-relaxed bg-[#2a2a2a] px-3.5 py-2.5 rounded-xl border border-white/5 shadow-inner">
                    {c.text}
                  </p>
                </div>
              ))
            )}
          </div>
          <div className="p-4 border-t border-[#333] bg-[#111]">
            <button 
              onClick={handleSummarize}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-all shadow-[0_0_15px_rgba(37,99,235,0.4)] flex justify-center items-center gap-2 active:scale-95"
            >
              <FileText size={18} />
              View Live Summary
            </button>
          </div>
        </div>
      )}

      {/* Live Captions Overlay */}
      {showCaptions && captions.length > 0 && (
        <div className="absolute bottom-28 left-0 right-0 z-20 flex justify-center pointer-events-none px-4">
          <div 
            ref={captionRef}
            className="bg-black/60 text-white p-3 text-sm max-w-3xl w-full max-h-40 overflow-y-auto pointer-events-auto rounded-xl shadow-2xl flex flex-col gap-1 scrollbar-hide"
          >
            {captions.slice(-5).map((c, i) => (
              <div key={i} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <b>{c.speaker}:</b> {c.text}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Control Bar */}
      <div className='absolute bottom-0 left-0 right-0 z-30 pb-6 px-6'>
        <div className='mx-auto max-w-fit bg-black/50 backdrop-blur-xl border border-white/10 rounded-2xl p-2 flex items-center gap-2 shadow-2xl'>
          
          <button
            onClick={() => setIsMicOn(!isMicOn)}
            className={cn('p-4 rounded-xl transition-all duration-300 active:scale-95', isMicOn ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-red-500/90 hover:bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.5)]')}
            title="Toggle Microphone"
          >
            {isMicOn ? <Mic size={22} /> : <MicOff size={22} />}
          </button>
          
          <button
            onClick={() => setIsCamOn(!isCamOn)}
            className={cn('p-4 rounded-xl transition-all duration-300 active:scale-95', isCamOn ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-red-500/90 hover:bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.5)]')}
            title="Toggle Camera"
          >
            {isCamOn ? <Video size={22} /> : <VideoOff size={22} />}
          </button>
          
          <div className="w-[1px] h-8 bg-white/20 mx-2" />

          <button
            onClick={() => setShowCaptions(!showCaptions)}
            className={cn('p-4 rounded-xl transition-all duration-300 active:scale-95', showCaptions ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]' : 'bg-white/10 hover:bg-white/20 text-white')}
            title="Toggle Live Captions"
          >
            <MessageSquareText size={22} />
          </button>

          <button
            onClick={() => setShowTranscriptPanel(!showTranscriptPanel)}
            className={cn('p-4 rounded-xl transition-all duration-300 active:scale-95 flex items-center gap-2', showTranscriptPanel ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]' : 'bg-white/10 hover:bg-white/20 text-white')}
            title="Toggle Transcript Panel"
          >
            <AlignLeft size={22} />
          </button>

          <button
            onClick={handleCopyLink}
            className="p-4 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all duration-300 active:scale-95"
            title="Copy Meeting Link"
          >
            <Copy size={22} />
          </button>

          <div className="w-[1px] h-8 bg-white/20 mx-2" />
          
          <button
            onClick={handleEndCall}
            className="px-6 py-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold transition-all duration-300 active:scale-95 shadow-[0_0_20px_rgba(220,38,38,0.6)] flex items-center gap-2"
          >
            <PhoneOff size={22} />
            <span className="hidden sm:inline">End Call</span>
          </button>

        </div>
      </div>
    </section>
  )
}

export default MeetingRoom