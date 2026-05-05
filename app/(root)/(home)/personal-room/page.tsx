"use client";

import React, { useMemo } from 'react'
import { useUser } from '@clerk/nextjs'
import { toast } from 'sonner'
import Link from 'next/link'
import { Copy, ExternalLink, User, Sparkles } from 'lucide-react'

const PersonalRoom = () => {
  const { user, isLoaded, isSignedIn } = useUser();

  const roomId = useMemo(() => user?.id ?? '', [user?.id]);
  const inviteLink = useMemo(() => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    return roomId ? `${origin}/meeting/${roomId}?personal=true` : '';
  }, [roomId]);

  if (!isLoaded) {
    return (
      <section className='flex size-full items-center justify-center'>
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-9 w-9 border-[3px] border-indigo-100 border-t-indigo-500"></div>
          <p className="text-gray-400 text-sm font-medium">Loading your room...</p>
        </div>
      </section>
    );
  }

  if (!isSignedIn || !roomId) {
    return (
      <section className='flex size-full items-center justify-center'>
        <div className="text-center bg-white rounded-3xl border border-indigo-100/60 shadow-card p-12">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100 flex items-center justify-center mx-auto mb-5">
            <User className="w-7 h-7 text-indigo-300" />
          </div>
          <p className="text-gray-500 text-sm">Please sign in to access your personal room.</p>
        </div>
      </section>
    );
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      toast.success('Personal room link copied');
    } catch (e) {
      toast.error('Failed to copy link');
    }
  };

  return (
    <section className='flex size-full flex-col gap-8 animate-fade-in'>
      {/* Page header */}
      <header className="flex items-center gap-4">
        <div className="flex items-center justify-center w-12 h-12 rounded-2xl
          bg-gradient-to-br from-indigo-100 to-violet-100 border border-indigo-200/50 shadow-sm">
          <Sparkles className="w-5 h-5 text-indigo-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
            Personal Room
          </h1>
          <p className="text-sm text-gray-400 mt-0.5 font-medium">Your dedicated meeting space — always available</p>
        </div>
      </header>

      <div className="h-px bg-gradient-to-r from-indigo-200 via-violet-200 to-transparent" />

      <div className='max-w-2xl space-y-5'>
        {/* Room ID card */}
        <div className='relative rounded-3xl bg-white border border-indigo-100/60 shadow-card overflow-hidden'>
          {/* Top accent */}
          <div className="h-1 bg-gradient-to-r from-indigo-400 via-violet-500 to-purple-400" />
          <div className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <p className='text-xs font-bold text-gray-400 uppercase tracking-widest'>Your Room ID</p>
            </div>

            <div className='flex items-center justify-between rounded-2xl bg-gradient-to-r from-indigo-50/80 to-violet-50/60
              border border-indigo-100 px-4 py-3 gap-3'>
              <span className='truncate text-sm font-mono text-indigo-700'>{roomId}</span>
              <button
                onClick={handleCopy}
                className='flex items-center gap-1.5 rounded-xl
                  bg-gradient-to-r from-indigo-500 to-violet-600
                  hover:from-indigo-600 hover:to-violet-700
                  text-white text-xs px-3.5 py-1.5 font-semibold
                  transition-all duration-200 shrink-0 shadow-sm hover:shadow-glow-indigo active:scale-[0.96]'
              >
                <Copy size={11} />
                Copy Link
              </button>
            </div>
            <p className='mt-3 break-all text-[11px] text-gray-400 font-mono leading-relaxed bg-gray-50 rounded-xl px-3 py-2'>{inviteLink}</p>
          </div>
        </div>

        {/* Action button */}
        <div className='flex gap-3 items-center flex-wrap'>
          <Link
            href={`/meeting/${roomId}?personal=true`}
            className='flex items-center gap-2 rounded-2xl
              bg-gradient-to-r from-indigo-500 to-violet-600
              hover:from-indigo-600 hover:to-violet-700
              text-white px-6 py-3 text-sm font-semibold
              transition-all duration-200 shadow-sm hover:shadow-glow-indigo active:scale-[0.97]'
          >
            <ExternalLink size={15} />
            Start / Join Room
          </Link>
        </div>
      </div>
    </section>
  )
}

export default PersonalRoom
