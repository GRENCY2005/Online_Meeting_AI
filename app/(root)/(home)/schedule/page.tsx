'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import {
  CalendarPlus, CheckCircle2, AlertCircle, Loader2,
  ExternalLink, ChevronRight, CalendarCheck, Calendar, ChevronDown
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ScheduledEvent {
  actionItem: string
  eventId: string
  eventLink: string
  title: string
  scheduledDate: string
  priority: 'high' | 'medium' | 'low'
}

interface RecapItem {
  _id: string
  meetingId: string
  description: string | null
  scheduledAt: string | null
  createdAt: string
  actionItems: string[]
  scheduledEvents: ScheduledEvent[]
}

const PRIORITY_BADGE: Record<string, string> = {
  high:   'bg-red-50 text-red-600 border-red-100',
  medium: 'bg-amber-50 text-amber-600 border-amber-100',
  low:    'bg-emerald-50 text-emerald-600 border-emerald-100',
}

const DATE_RANGES = [
  { label: 'Recent (last 2 days)',  days: 2   },
  { label: 'Last week',             days: 7   },
  { label: 'Last 2 weeks',          days: 14  },
  { label: 'Last month',            days: 30  },
  { label: 'Last 2 months',         days: 60  },
  { label: 'Last 3 months',         days: 90  },
]

export default function SmartSchedulePage() {
  const { user }       = useUser()
  const router         = useRouter()
  const searchParams   = useSearchParams()

  const [recaps,          setRecaps]          = useState<RecapItem[]>([])
  const [isLoading,       setIsLoading]       = useState(true)
  const [gcalConnected,   setGcalConnected]   = useState<boolean | null>(null)
  const [gcalEmail,       setGcalEmail]       = useState<string | null>(null)
  const [selectedRange,   setSelectedRange]   = useState(DATE_RANGES[3]) // default: last month

  // Per-meeting scheduling state
  const [scheduling,      setScheduling]      = useState<Record<string, boolean>>({})
  const [results,         setResults]         = useState<Record<string, { scheduled: ScheduledEvent[]; failed: any[] }>>({})
  const [errors,          setErrors]          = useState<Record<string, string>>({})

  // Filter recaps by selected date range
  const filteredRecaps = recaps.filter(r => {
    const meetingDate = new Date(r.scheduledAt ?? r.createdAt)
    const cutoff      = new Date(Date.now() - selectedRange.days * 24 * 60 * 60 * 1000)
    return meetingDate >= cutoff
  })

  const hasFetched    = useRef(false)
  const googleParam   = searchParams.get('google')

  // ── Load all recaps ────────────────────────────────────────────────────
  useEffect(() => {
    if (hasFetched.current) return
    hasFetched.current = true
    fetch('http://localhost:3001/api/recaps')
      .then(r => r.json())
      .then(data => {
        const seen = new Map<string, RecapItem>()
        for (const item of data as RecapItem[]) {
          if (!seen.has(item.meetingId)) seen.set(item.meetingId, item)
        }
        setRecaps(Array.from(seen.values()).filter(r => r.actionItems?.length > 0))
      })
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [])

  // ── Check Google Calendar connection (re-runs after OAuth redirect) ───
  useEffect(() => {
    if (!user?.id) return
    // Optimistically mark as connected while we fetch, so UI doesn't flicker
    if (googleParam === 'connected') setGcalConnected(true)

    fetch(`http://localhost:3001/api/google/status/${user.id}`)
      .then(r => r.json())
      .then(d => { setGcalConnected(d.connected); setGcalEmail(d.email ?? null) })
      .catch(() => { if (googleParam !== 'connected') setGcalConnected(false) })
  }, [user?.id, googleParam])

  const handleConnect = () => {
    if (!user?.id) return
    window.location.href = `http://localhost:3001/api/google/auth?userId=${user.id}`
  }

  const handleScheduleMeeting = async (meetingId: string) => {
    if (!user?.id) return
    setScheduling(prev => ({ ...prev, [meetingId]: true }))
    setErrors(prev => { const n = { ...prev }; delete n[meetingId]; return n })

    try {
      const controller = new AbortController()
      const timeoutId  = setTimeout(() => controller.abort(), 90_000)

      let res: Response
      try {
        res = await fetch(`http://localhost:3001/api/google/schedule/${meetingId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id }),
          signal: controller.signal
        })
      } finally {
        clearTimeout(timeoutId)
      }
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Scheduling failed')
      setResults(prev => ({ ...prev, [meetingId]: data }))
      // Refresh recaps to reflect stored event IDs (deduplicate same as initial load)
      const updated = await fetch('http://localhost:3001/api/recaps')
      if (updated.ok) {
        const all = await updated.json()
        const seen = new Map<string, RecapItem>()
        for (const item of all as RecapItem[]) {
          if (!seen.has(item.meetingId)) seen.set(item.meetingId, item)
        }
        setRecaps(Array.from(seen.values()).filter(r => r.actionItems?.length > 0))
      }
    } catch (err: any) {
      const msg = err.name === 'AbortError'
        ? 'Request timed out (90 s). Check that the backend server is running.'
        : (err.message || 'Scheduling failed')
      setErrors(prev => ({ ...prev, [meetingId]: msg }))
    } finally {
      setScheduling(prev => ({ ...prev, [meetingId]: false }))
    }
  }

  // ── UI ────────────────────────────────────────────────────────────────
  return (
    <section className="flex size-full flex-col gap-8 animate-fade-in">

      {/* Header */}
      <header className="flex items-center gap-4">
        <div className="flex items-center justify-center w-12 h-12 rounded-2xl
          bg-gradient-to-br from-blue-100 to-indigo-100 border border-blue-200/50 shadow-sm">
          <CalendarPlus className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent leading-tight">
            Smart Schedule
          </h1>
          <p className="text-sm text-gray-400 mt-0.5 font-medium">
            Auto-schedule action items from your meetings into Google Calendar
          </p>
        </div>
      </header>
      <div className="h-px bg-gradient-to-r from-blue-200 via-indigo-200 to-transparent -mt-4" />

      {/* Google Calendar connection banner */}
      <div className={`rounded-2xl border px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4
        ${gcalConnected
          ? 'bg-emerald-50 border-emerald-100'
          : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100'}`}>

        <div className="flex items-start gap-3">
          <div className={`p-2.5 rounded-xl shrink-0 ${gcalConnected ? 'bg-emerald-100' : 'bg-blue-100'}`}>
            <CalendarCheck size={20} className={gcalConnected ? 'text-emerald-600' : 'text-blue-600'} />
          </div>
          <div>
            {gcalConnected === null ? (
              <p className="text-sm text-gray-500 flex items-center gap-2">
                <Loader2 size={13} className="animate-spin" /> Checking connection…
              </p>
            ) : gcalConnected ? (
              <>
                <p className="text-sm font-bold text-emerald-700 flex items-center gap-1.5">
                  <CheckCircle2 size={14} /> Google Calendar Connected
                </p>
                <p className="text-xs text-emerald-600 mt-0.5">Signed in as <strong>{gcalEmail}</strong></p>
              </>
            ) : (
              <>
                <p className="text-sm font-bold text-gray-800">Connect Google Calendar</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Grant access once — action items will be auto-scheduled with conflict avoidance.
                </p>
              </>
            )}
          </div>
        </div>

        {gcalConnected === false && (
          <Button onClick={handleConnect}
            className="shrink-0 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl gap-2.5 font-semibold shadow-sm text-sm h-10">
            <GoogleIcon />
            Sign in with Google
          </Button>
        )}
      </div>

      {/* How it works */}
      {!gcalConnected && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { step: '1', label: 'Connect Google', desc: 'One-time OAuth — we only request Calendar write access.' },
            { step: '2', label: 'Pick a Meeting', desc: 'Choose any meeting whose action items you want scheduled.' },
            { step: '3', label: 'Auto-Schedule', desc: 'Groq AI extracts deadlines & priorities; we find free slots and create events.' },
          ].map(item => (
            <div key={item.step} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex gap-4 items-start">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold text-sm shrink-0">
                {item.step}
              </span>
              <div>
                <p className="text-sm font-bold text-gray-800">{item.label}</p>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Date range dropdown + meeting list */}
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-10 w-10 border-[3px] border-indigo-100 border-t-indigo-500" />
            <p className="text-sm text-gray-400 font-medium">Loading meetings…</p>
          </div>
        </div>
      ) : recaps.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[280px] rounded-3xl
          bg-white border-2 border-dashed border-blue-200/60">
          <div className="flex flex-col items-center gap-4 max-w-xs text-center px-6">
            <div className="p-5 rounded-3xl bg-gradient-to-br from-blue-100 to-indigo-100 border border-blue-200/60 shadow-sm">
              <Calendar className="w-10 h-10 text-blue-400" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-lg font-bold text-gray-800">No Action Items Yet</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                End a meeting, generate a summary — action items will appear here to schedule.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* ── Date range selector ── */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <h2 className="text-sm font-bold text-gray-600 uppercase tracking-wider">
              {filteredRecaps.length} meeting{filteredRecaps.length !== 1 ? 's' : ''} with action items
            </h2>
            <div className="relative">
              <select
                value={selectedRange.days}
                onChange={e => {
                  const range = DATE_RANGES.find(r => r.days === Number(e.target.value))
                  if (range) setSelectedRange(range)
                }}
                className="appearance-none pl-4 pr-10 py-2.5 rounded-xl border border-gray-200
                  bg-white text-sm font-semibold text-gray-700 shadow-sm
                  hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200
                  cursor-pointer transition-colors"
              >
                {DATE_RANGES.map(r => (
                  <option key={r.days} value={r.days}>{r.label}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {filteredRecaps.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[200px] rounded-3xl
              bg-white border-2 border-dashed border-blue-200/60">
              <div className="flex flex-col items-center gap-3 max-w-xs text-center px-6">
                <Calendar className="w-8 h-8 text-blue-300" />
                <p className="text-sm font-semibold text-gray-600">No meetings in this period</p>
                <p className="text-xs text-gray-400">Try selecting a wider date range from the dropdown.</p>
              </div>
            </div>
          ) : (
            <>
              {filteredRecaps.map(recap => (
                <MeetingScheduleCard
                  key={recap.meetingId}
                  recap={recap}
                  gcalConnected={!!gcalConnected}
                  isScheduling={!!scheduling[recap.meetingId]}
                  result={results[recap.meetingId]}
                  error={errors[recap.meetingId]}
                  onSchedule={() => handleScheduleMeeting(recap.meetingId)}
                  onConnect={handleConnect}
                  onViewRecap={() => router.push(`/recap/${recap.meetingId}`)}
                />
              ))}
            </>
          )}
        </div>
      )}
    </section>
  )
}

// ── Meeting card ──────────────────────────────────────────────────────────
function MeetingScheduleCard({
  recap, gcalConnected, isScheduling, result, error, onSchedule, onConnect, onViewRecap
}: {
  recap: RecapItem
  gcalConnected: boolean
  isScheduling: boolean
  result?: { scheduled: ScheduledEvent[]; failed: any[] }
  error?: string
  onSchedule: () => void
  onConnect: () => void
  onViewRecap: () => void
}) {
  const alreadyScheduled = (recap.scheduledEvents || []).length > 0
  const dateLabel = recap.scheduledAt
    ? new Date(recap.scheduledAt).toLocaleDateString()
    : new Date(recap.createdAt).toLocaleDateString()

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Top bar */}
      <div className="h-1 w-full bg-gradient-to-r from-blue-500 to-indigo-600" />

      <div className="p-6 space-y-4">
        {/* Meeting title row */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-bold text-gray-800 text-sm">
              {recap.description || 'Instant Meeting'}
            </p>
            <p className="text-xs text-gray-400 font-mono mt-0.5">
              {recap.meetingId.length > 20 ? '…' + recap.meetingId.slice(-16) : recap.meetingId}
            </p>
            <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
              <Calendar size={11} /> {dateLabel}
            </p>
          </div>
          <button onClick={onViewRecap}
            className="shrink-0 text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1 transition-colors">
            View Recap <ChevronRight size={13} />
          </button>
        </div>

        {/* Action items */}
        <div className="space-y-1.5">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
            {recap.actionItems.length} Action Item{recap.actionItems.length > 1 ? 's' : ''}
          </p>
          {recap.actionItems.slice(0, 3).map((item, i) => (
            <div key={i} className="text-xs text-gray-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-1.5 truncate">
              {item}
            </div>
          ))}
          {recap.actionItems.length > 3 && (
            <p className="text-xs text-gray-400 pl-1">+{recap.actionItems.length - 3} more</p>
          )}
        </div>

        {/* Already-scheduled events */}
        {alreadyScheduled && (
          <div className="space-y-1.5">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 size={11} className="text-emerald-500" /> Scheduled Events
            </p>
            {recap.scheduledEvents.map((ev, i) => (
              <div key={i} className="flex items-center justify-between gap-2 bg-gray-50 rounded-xl px-3 py-2 border border-gray-100">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-full border shrink-0 ${PRIORITY_BADGE[ev.priority] || PRIORITY_BADGE.medium}`}>
                    {ev.priority}
                  </span>
                  <span className="text-xs text-gray-700 truncate">{ev.title}</span>
                  <span className="text-[11px] text-gray-400 shrink-0">
                    {new Date(ev.scheduledDate).toLocaleDateString()}
                  </span>
                </div>
                <a href={ev.eventLink} target="_blank" rel="noreferrer"
                  className="shrink-0 flex items-center gap-1 text-[11px] text-blue-600 hover:underline font-medium">
                  Open <ExternalLink size={10} />
                </a>
              </div>
            ))}
          </div>
        )}

        {/* New schedule result */}
        {result && result.scheduled.length === 0 && result.failed?.length > 0 && (
          <div className="rounded-xl bg-amber-50 border border-amber-100 px-4 py-3 space-y-1">
            <p className="text-xs text-amber-700 font-semibold flex items-center gap-1.5">
              <AlertCircle size={13} /> Could not schedule {result.failed.length} item{result.failed.length > 1 ? 's' : ''}
            </p>
            {result.failed.map((f: any, i: number) => (
              <p key={i} className="text-[11px] text-amber-600 pl-4">• {f.error}</p>
            ))}
          </div>
        )}

        {result && result.scheduled.length > 0 && (
          <div className="rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3 space-y-2">
            <p className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
              <CheckCircle2 size={13} /> {result.scheduled.length} event{result.scheduled.length > 1 ? 's' : ''} added to your Google Calendar!
            </p>
            {result.scheduled.map((ev, i) => (
              <div key={i} className="flex items-center justify-between text-xs text-emerald-700">
                <span className="truncate mr-2">{ev.title} · {new Date(ev.scheduledDate).toLocaleDateString()}</span>
                <a href={ev.eventLink} target="_blank" rel="noreferrer"
                  className="flex items-center gap-1 text-blue-600 hover:underline shrink-0">
                  View <ExternalLink size={10} />
                </a>
              </div>
            ))}
            <a
              href="https://calendar.google.com"
              target="_blank"
              rel="noreferrer"
              className="mt-1 w-full flex items-center justify-center gap-2 py-2 rounded-lg
                bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-100
                text-xs font-bold transition-colors"
            >
              <ExternalLink size={12} /> Open Google Calendar to see all events
            </a>
          </div>
        )}

        {error && (
          <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3">
            <p className="text-xs text-red-600 font-semibold flex items-center gap-1.5 mb-1">
              <AlertCircle size={13} /> Scheduling failed
            </p>
            <p className="text-xs text-red-500">{error}</p>
          </div>
        )}

        {/* Action button */}
        {gcalConnected ? (
          <Button onClick={onSchedule} disabled={isScheduling}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700
              text-white rounded-xl gap-2 font-semibold shadow-sm text-sm h-10 disabled:opacity-60">
            {isScheduling
              ? <><Loader2 size={14} className="animate-spin" /> Scheduling with Groq AI…</>
              : <><CalendarPlus size={14} /> {alreadyScheduled ? 'Re-schedule All Tasks' : 'Schedule All Tasks'}</>
            }
          </Button>
        ) : (
          <Button onClick={onConnect}
            className="w-full bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl gap-2 font-semibold shadow-sm text-sm h-10">
            <GoogleIcon /> Connect Google Calendar to Schedule
          </Button>
        )}
      </div>
    </div>
  )
}

// ── Google "G" icon ───────────────────────────────────────────────────────
function GoogleIcon() {
  return (
    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  )
}
