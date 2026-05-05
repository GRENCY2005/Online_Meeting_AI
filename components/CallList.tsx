'use client'

import { useGetCalls } from '@/hooks/useGetCalls'
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import MeetingCard from './MeetingCard';
import { Video, Calendar, Clock } from 'lucide-react';

export const CallList = ({ type }: { type: 'ended' | 'upcoming' | 'recordings' }) => {
  const { endedCalls, upcomingCalls, isLoading } = useGetCalls();
  const router = useRouter();
  const [recordings] = useState<any[]>([]);

  const getCalls = () => {
    switch (type) {
      case 'ended':     return endedCalls;
      case 'recordings': return recordings;
      case 'upcoming':  return upcomingCalls;
      default:          return [];
    }
  };

  const getEmptyStateConfig = () => {
    switch (type) {
      case 'ended':
        return {
          icon: Clock,
          title: 'No Previous Calls',
          description: 'Your past meetings will appear here',
          gradient: 'from-violet-100 to-purple-100',
          border: 'border-violet-200/60',
          iconColor: 'text-violet-400',
        };
      case 'recordings':
        return {
          icon: Video,
          title: 'No Recordings',
          description: 'Recording sessions will be saved here',
          gradient: 'from-fuchsia-100 to-pink-100',
          border: 'border-fuchsia-200/60',
          iconColor: 'text-fuchsia-400',
        };
      case 'upcoming':
        return {
          icon: Calendar,
          title: 'No Upcoming Calls',
          description: 'Schedule a meeting to get started',
          gradient: 'from-indigo-100 to-blue-100',
          border: 'border-indigo-200/60',
          iconColor: 'text-indigo-400',
        };
      default:
        return {
          icon: Video,
          title: 'No Calls',
          description: '',
          gradient: 'from-gray-100 to-gray-50',
          border: 'border-gray-200/60',
          iconColor: 'text-gray-400',
        };
    }
  };

  const calls = getCalls();
  const emptyState = getEmptyStateConfig();
  const EmptyIcon = emptyState.icon;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[380px]">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-[3px] border-indigo-100 border-t-indigo-500"></div>
          <p className="text-sm text-gray-400 font-medium">Loading calls...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {calls && calls.length > 0 ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {calls.map((meeting: any) => {
            const base = typeof window !== 'undefined' ? window.location.origin : (process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000');
            const link = `${base}/meeting/${meeting.meetingId}`;
            return (
              <MeetingCard
                key={meeting.meetingId || Math.random()}
                icon={type === 'ended' ? '/icons/previous.svg' : type === 'upcoming' ? '/icons/upcoming.svg' : '/icons/recordings.svg'}
                title={meeting.description || 'Personal Meeting'}
                date={meeting.dateTime ? new Date(meeting.dateTime).toLocaleString() : 'No Date'}
                isPreviousMeeting={type === 'ended'}
                link={link}
                buttonIcon1={type === 'recordings' ? '/icons/play.svg' : undefined}
                buttonText={type === 'recordings' ? 'Play' : 'Start'}
                handleClick={() => router.push(`/meeting/${meeting.meetingId}`)}
              />
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center min-h-[380px] rounded-3xl
          bg-white border-2 border-dashed border-indigo-200/60 relative overflow-hidden">
          {/* Subtle bg decoration */}
          <div className="absolute inset-0 opacity-30"
            style={{ backgroundImage: 'radial-gradient(circle, #E0E7FF 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
          <div className="relative flex flex-col items-center gap-4 max-w-xs text-center px-6">
            <div className={`p-5 rounded-3xl bg-gradient-to-br ${emptyState.gradient} border ${emptyState.border} shadow-sm`}>
              <EmptyIcon className={`w-10 h-10 ${emptyState.iconColor}`} />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-lg font-bold text-gradient-indigo">{emptyState.title}</h3>
              <p className="text-sm text-gray-400 font-medium leading-relaxed">{emptyState.description}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CallList;
