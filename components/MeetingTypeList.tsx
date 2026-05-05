'use client'
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { toast } from 'sonner'
import ReactDatePicker from 'react-datepicker'

import HomeCard from './HomeCard'
import MeetingModal from './MeetingModal'

const generateId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0;pointer-events:none;';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
};

const MeetingTypeList = () => {
  const router = useRouter()
  const [values, setValues] = useState({
    dateTime: new Date(),
    description: '',
    link: '',
  })
  const [callDetails, setCallDetails] = useState<{ id: string } | undefined>()
  const [meetingState, setMeetingState] = useState<
    'isScheduleMeeting' | 'isJoinMeeting' | 'isInstantMeeting' | undefined
  >()

  const { user } = useUser()

  const createMeeting = async () => {
    if (!user) {
      toast.error('You must be signed in to create a meeting')
      return;
    }

    try {
      if (!values.dateTime) {
        toast.error('Please select a date and time')
        return
      }

      const id = generateId()

      if (meetingState === 'isScheduleMeeting') {
        const res = await fetch('http://localhost:3001/api/meetings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            meetingId: id,
            description: values.description,
            dateTime: values.dateTime.toISOString(),
            createdBy: user.id
          })
        });
        if (!res.ok) throw new Error('Failed to create scheduled meeting');
        
        setCallDetails({ id })
        toast.success('Meeting Created')
      } else {
        // With pure WebRTC, the room is created dynamically when the first person joins the socket.
        setCallDetails({ id })
        router.push(`/meeting/${id}`)
        toast.success('Meeting Created')
      }
    } catch (error) {
      console.error(error)
      toast.error('Failed to create meeting')
    }
  }

  const joinMeeting = () => {
    const url = values.link?.trim()
    if (!url) {
      toast.error('Please paste a meeting link')
      return
    }
    try {
      // Allow both absolute and relative meeting links
      if (url.startsWith('http')) {
         // Extract everything after /meeting/ if it exists, otherwise just the ending
         const meetingId = url.split('/meeting/')[1];
         if (meetingId) {
             router.push(`/meeting/${meetingId}`)
         } else {
             router.push(url)
         }
      } else if (url.startsWith('/')) {
         router.push(url)
      } else {
         router.push(`/meeting/${url}`)
      }
      setMeetingState(undefined)
    } catch (e) {
      toast.error('Invalid meeting link')
    }
  }

  const origin = typeof window !== 'undefined'
    ? window.location.origin
    : (process.env.NEXT_PUBLIC_BASE_URL ?? '')
  const meetingLink = callDetails?.id ? `${origin}/meeting/${callDetails.id}` : ''

  return (
    <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
      <HomeCard
        img="/icons/plus.png"
        title="New Meeting"
        description="Start an instant meeting"
        handleClick={() => setMeetingState('isInstantMeeting')}
        className="bg-red-700 bg-gradient-to-br from-red-600 via-rose-700 to-pink-800"
      />
      <HomeCard
        img="/icons/calendar.png"
        title="Schedule Meeting"
        description="Plan your meeting"
        handleClick={() => setMeetingState('isScheduleMeeting')}
        className="bg-gradient-to-br from-indigo-500 via-blue-500 to-cyan-500"
      />
      <HomeCard
        img="/icons/recordings.svg"
        title="Meeting Recaps"
        description="View summaries & transcripts"
        handleClick={() => router.push('/recaps')}
        className="bg-gradient-to-br from-violet-500 via-purple-600 to-fuchsia-600"
      />
      <HomeCard
        img="/icons/user.png"
        title="Join Meeting"
        description="Via invitation link"
        handleClick={() => setMeetingState('isJoinMeeting')}
        className="bg-gradient-to-br from-amber-600 via-orange-600 to-red-600"
      />

      {/* Schedule Meeting Modal */}
      {!callDetails ? (
        <MeetingModal
          isOpen={meetingState === 'isScheduleMeeting'}
          onClose={() => setMeetingState(undefined)}
          title="Create Meeting"
          handleClick={createMeeting}
          buttonIcon="/icons/plus.png"
        >
          <div className="flex flex-col gap-2.5">
            <label className="text-sm font-semibold text-gray-700">
              Add a description
            </label>
            <textarea
              rows={3}
              placeholder="What's this meeting about?"
              className="w-full rounded-xl bg-indigo-50/50 px-4 py-3 text-gray-800 placeholder:text-gray-400 border border-indigo-100 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200/60 transition-all duration-200 resize-none font-poppins text-sm"
              onChange={(e) =>
                setValues({ ...values, description: e.target.value })
              }
              value={values.description}
            />
          </div>
          <div className="flex w-full flex-col gap-2.5">
            <label className="text-sm font-semibold text-gray-700">
              Select Date and Time
            </label>
            <ReactDatePicker
              selected={values.dateTime}
              onChange={(date: Date | null) => {
                if (date) {
                  setValues({ ...values, dateTime: date })
                }
              }}
              showTimeSelect
              timeFormat="HH:mm"
              timeIntervals={15}
              timeCaption="time"
              dateFormat="MMMM d, yyyy h:mm aa"
              minDate={new Date()}
              placeholderText="Select date & time"
              className="w-full rounded-xl bg-indigo-50/50 px-4 py-3 text-gray-800 placeholder:text-gray-400 border border-indigo-100 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200/60 transition-all duration-200 font-poppins text-sm"
            />
          </div>
        </MeetingModal>
      ) : (
        <MeetingModal
          isOpen={meetingState === 'isScheduleMeeting'}
          onClose={() => setMeetingState(undefined)}
          title="Meeting Created"
          className="text-center"
          handleClick={async () => {
            if (!meetingLink) {
              toast.error('Unable to build meeting link')
              return
            }
            const ok = await copyToClipboard(meetingLink)
            ok ? toast.success('Link copied') : toast.error('Could not copy — please copy manually: ' + meetingLink)
          }}
          image="/icons/checked.svg"
          buttonIcon="/icons/copy.svg"
          buttonText="Copy Meeting Link"
        />
      )}

      {/* Instant Meeting Modal */}
      <MeetingModal
        isOpen={meetingState === 'isInstantMeeting'}
        onClose={() => setMeetingState(undefined)}
        title="Start an Instant Meeting"
        className="text-center"
        buttonText="Start Meeting"
        handleClick={createMeeting}
        buttonIcon="/icons/plus.png"
      />

      {/* Join Meeting Modal */}
      <MeetingModal
        isOpen={meetingState === 'isJoinMeeting'}
        onClose={() => setMeetingState(undefined)}
        title="Join a Meeting"
        handleClick={joinMeeting}
        buttonIcon="/icons/user.png"
        buttonText="Join"
      >
        <div className="flex flex-col gap-2.5">
          <label className="text-sm font-semibold text-gray-700">
            Paste invitation link
          </label>
          <input
            type="text"
            placeholder="https://your-domain/meeting/123..."
            className="w-full rounded-xl bg-indigo-50/50 px-4 py-3 text-gray-800 placeholder:text-gray-400 border border-indigo-100 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200/60 transition-all duration-200 font-poppins text-sm"
            value={values.link}
            onChange={(e) => setValues({ ...values, link: e.target.value })}
          />
        </div>
      </MeetingModal>
    </section>
  )
}

export default MeetingTypeList
