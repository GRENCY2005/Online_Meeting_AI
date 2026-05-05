'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  BrainCircuit, ChevronLeft, Printer,
  FileText, Target, CheckSquare, MessageSquare, Calendar
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface RecapData {
  meetingId: string
  summary: string
  keyPoints: string[]
  actionItems: string[]
  decisions: string[]
  fullTranscript: string
  createdAt: string
  description: string | null
  scheduledAt: string | null
}

export default function RecapDetailPage() {
  const { meetingId } = useParams<{ meetingId: string }>()
  const router        = useRouter()
  const [recap,     setRecap]     = useState<RecapData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error,     setError]     = useState<string | null>(null)
  const hasFetched  = useRef(false)

  useEffect(() => {
    if (hasFetched.current || !meetingId) return
    hasFetched.current = true
    ;(async () => {
      try {
        const res = await fetch(`http://localhost:3001/api/recaps/${meetingId}`)
        if (!res.ok) throw new Error('Recap not found for this meeting.')
        setRecap(await res.json())
      } catch (err: any) {
        setError(err.message || 'Failed to load recap.')
      } finally {
        setIsLoading(false)
      }
    })()
  }, [meetingId])

  const handleSaveAsPDF = () => window.print()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F5F0FF] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-[3px] border-indigo-100 border-t-indigo-500" />
          <p className="text-sm text-gray-400 font-medium">Loading recap…</p>
        </div>
      </div>
    )
  }

  if (error || !recap) {
    return (
      <div className="min-h-screen bg-[#F5F0FF] flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-10 max-w-md w-full text-center">
          <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center mx-auto mb-4">
            <MessageSquare size={24} className="text-red-400" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Recap Not Found</h1>
          <p className="text-gray-500 text-sm mb-6">{error || 'No recap exists for this meeting ID.'}</p>
          <Button onClick={() => router.push('/recaps')}
            className="bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl h-10 px-6 font-semibold">
            Back to Recaps
          </Button>
        </div>
      </div>
    )
  }

  const dateLabel = recap.scheduledAt
    ? new Date(recap.scheduledAt).toLocaleString()
    : new Date(recap.createdAt).toLocaleString()

  const transcriptLines = (recap.fullTranscript || '')
    .split('\n').map(l => l.trim()).filter(Boolean)
    .map(line => {
      const idx = line.indexOf(':')
      return idx > 0
        ? { speaker: line.slice(0, idx).trim(), text: line.slice(idx + 1).trim() }
        : { speaker: '', text: line }
    })

  return (
    <main className="min-h-screen bg-[#F5F0FF] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* ── Toolbar ── */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
          <Button onClick={() => router.push('/recaps')} variant="ghost"
            className="text-gray-500 hover:text-gray-900 hover:bg-white rounded-xl gap-2 font-medium">
            <ChevronLeft size={18} /> Back to Recaps
          </Button>
          <Button onClick={handleSaveAsPDF}
            className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700
              text-white rounded-xl gap-2 font-semibold shadow-sm hover:shadow-md">
            <Printer size={15} /> Save as PDF
          </Button>
        </div>

        {/* ── Title Card ── */}
        <div className="relative bg-gradient-to-br from-violet-600 to-purple-700 rounded-2xl p-8 shadow-lg overflow-hidden">
          <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/10 pointer-events-none" />
          <div className="absolute -bottom-10 -left-6 w-36 h-36 rounded-full bg-white/10 pointer-events-none" />
          <div className="relative flex items-center gap-3 mb-1.5">
            <BrainCircuit className="text-purple-200 shrink-0" size={26} />
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              {recap.description || 'Meeting Recap'}
            </h1>
          </div>
          <div className="relative flex items-center gap-4 mt-2 flex-wrap">
            <p className="text-purple-200 text-sm font-mono tracking-wide">ID: {recap.meetingId}</p>
            <span className="flex items-center gap-1.5 text-purple-200 text-sm">
              <Calendar size={13} /> {dateLabel}
            </span>
          </div>
        </div>

        {/* ── AI Summary ── */}
        {recap.summary && (
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <h2 className="text-xs font-bold text-violet-600 uppercase tracking-widest mb-4 flex items-center gap-2">
              <FileText size={14} /> Executive Summary
            </h2>
            <p className="text-gray-700 leading-relaxed text-[15px]">{recap.summary}</p>
          </div>
        )}

        {/* ── Key Points + Decisions ── */}
        {((recap.keyPoints?.length ?? 0) > 0 || (recap.decisions?.length ?? 0) > 0) && (
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <h2 className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Target size={14} /> Key Points &amp; Decisions
            </h2>
            <ul className="space-y-3">
              {recap.keyPoints?.map((pt, i) => (
                <li key={i} className="flex gap-2.5 items-start">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                  <span className="text-gray-600 text-sm leading-relaxed">{pt}</span>
                </li>
              ))}
              {recap.decisions?.map((dec, i) => (
                <li key={`d${i}`} className="flex gap-2.5 items-start">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0" />
                  <span className="text-gray-700 text-sm font-medium leading-relaxed">{dec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* ── Action Items ── */}
        {(recap.actionItems?.length ?? 0) > 0 && (
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <h2 className="text-xs font-bold text-amber-600 uppercase tracking-widest mb-4 flex items-center gap-2">
              <CheckSquare size={14} /> Action Items
            </h2>
            <ul className="space-y-2.5">
              {recap.actionItems.map((item, i) => (
                <li key={i} className="flex gap-2.5 items-start bg-amber-50 px-3 py-2.5 rounded-xl border border-amber-100">
                  <CheckSquare size={14} className="text-amber-500 mt-0.5 shrink-0" />
                  <span className="text-gray-600 text-sm leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* ── Full Transcript ── */}
        {transcriptLines.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/70 flex justify-between items-center sticky top-0">
              <h2 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                <MessageSquare size={15} className="text-violet-500" /> Full Transcript
              </h2>
              <span className="text-xs font-mono text-gray-400 bg-white border border-gray-200 px-2 py-1 rounded-lg">
                {transcriptLines.length} lines
              </span>
            </div>
            <div className="p-6 space-y-4 max-h-[500px] overflow-y-auto print:max-h-none">
              {transcriptLines.map((line, i) => (
                <div key={i} className="flex flex-col gap-1">
                  {line.speaker && (
                    <span className="text-violet-600 font-semibold text-sm">{line.speaker}</span>
                  )}
                  <p className="text-gray-600 text-[14px] leading-relaxed bg-gray-50 border border-gray-100 px-3 py-2 rounded-xl">
                    {line.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="hidden print:block text-center text-xs text-gray-400 pt-4 border-t border-gray-200">
          Generated by MeetVerse · {new Date().toLocaleDateString()}
        </div>

      </div>
    </main>
  )
}
