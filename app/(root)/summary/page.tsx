"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Caption } from "@/hooks/useWebRTC";
import { Button } from "@/components/ui/button";
import { FileText, ChevronLeft, MessageSquare, Download, Printer, Loader2, Target, CheckSquare, BrainCircuit } from "lucide-react";

interface GroqSummary {
  summary: string;
  key_points: string[];
  action_items: string[];
  decisions: string[];
}

export default function SummaryPage() {
  const router = useRouter();
  const [summary, setSummary] = useState<GroqSummary | null>(null);
  const [captions, setCaptions] = useState<Caption[]>([]);
  const [meetingId, setMeetingId] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const hasFetched = useRef(false);

  useEffect(() => {
    // Guard against React StrictMode double-invocation and repeated navigations
    if (hasFetched.current) return;
    hasFetched.current = true;

    if (typeof window !== "undefined") {
      const storedCaptions = sessionStorage.getItem("meeting-captions");
      const storedMeetingId = sessionStorage.getItem("meeting-id");

      if (storedCaptions) {
        const parsed: Caption[] = JSON.parse(storedCaptions);
        setCaptions(parsed);
        if (storedMeetingId) setMeetingId(storedMeetingId);

        const fetchGroqSummary = async () => {
          setIsGenerating(true);
          try {
            const fullText = parsed.map(c => `${c.speaker}: ${c.text}`).join('\n');
            const res = await fetch('http://localhost:3001/api/meeting/generate-summary', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ transcript: fullText, meetingId: storedMeetingId })
            });
            if (!res.ok) throw new Error("Failed to reach Groq API through backend.");
            const data = await res.json();
            setSummary(data);
          } catch (err: any) {
            console.error("Summary Gen Error:", err);
            setError(err.message || "Something went wrong.");
          } finally {
            setIsGenerating(false);
          }
        };
        fetchGroqSummary();
      }
    }
  }, []);

  const handleReturnHome = () => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("meeting-captions");
      sessionStorage.removeItem("meeting-id");
    }
    router.push("/");
  };

  const handleDownloadTranscript = () => {
    const content = captions.map(c => {
      const time = c.timestamp ? new Date(c.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Unknown Time';
      return `[${time}] ${c.speaker}: ${c.text}`;
    }).join('\n\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Transcript-${meetingId || 'Local'}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSaveAsPDF = () => window.print();

  if (!captions.length) {
    return (
      <div className="min-h-screen bg-surface2 flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-white rounded-3xl shadow-card-hover border border-gray-100 p-12 max-w-md w-full">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center mx-auto mb-5">
            <MessageSquare size={28} className="text-blue-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">No Meeting Data Found</h1>
          <p className="text-gray-500 text-sm mb-8 leading-relaxed">No voice transcripts detected, or you arrived here directly.</p>
          <Button onClick={handleReturnHome} className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl h-11 px-6 font-semibold shadow-sm hover:shadow-md transition-all">
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-surface2 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
          <Button onClick={handleReturnHome} variant="ghost" className="text-gray-500 hover:text-gray-900 hover:bg-white rounded-xl gap-2 font-medium">
            <ChevronLeft size={18} /> Back to Dashboard
          </Button>
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <Button onClick={handleDownloadTranscript} variant="outline" className="flex-1 sm:flex-none border-gray-200 text-gray-600 hover:bg-white hover:text-gray-900 rounded-xl gap-2 font-medium">
              <Download size={15} /> Export .txt
            </Button>
            <Button onClick={handleSaveAsPDF} className="flex-1 sm:flex-none bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl gap-2 font-medium shadow-sm hover:shadow-md">
              <Printer size={15} /> Save as PDF
            </Button>
          </div>
        </div>

        {/* Title Card */}
        <div className="relative bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-8 shadow-lg overflow-hidden">
          <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/10 pointer-events-none" />
          <div className="absolute -bottom-10 -left-6 w-36 h-36 rounded-full bg-white/10 pointer-events-none" />
          <div className="relative flex items-center gap-3 mb-1.5">
            <BrainCircuit className="text-blue-200 shrink-0" size={26} />
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">AI Meeting Recap</h1>
          </div>
          <p className="relative text-blue-200 text-sm font-mono tracking-wide">
            ID: {meetingId || "Unknown"}
          </p>
        </div>

        {/* AI Summary Area */}
        {isGenerating ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-12 flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center mb-4">
              <Loader2 className="animate-spin text-blue-500" size={26} />
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-1.5">Analyzing transcripts...</h2>
            <p className="text-gray-400 text-sm max-w-sm">Groq LLM is generating your meeting summary and extracting action items.</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 rounded-2xl border border-red-100 p-8 flex flex-col items-center text-center">
            <p className="text-red-600 font-semibold mb-1.5">Unable to process summary with Groq.</p>
            <p className="text-gray-500 text-sm max-w-md">{error}</p>
            <p className="text-gray-400 text-xs mt-3">Make sure GROQ_API_KEY is configured in backend environment variables.</p>
          </div>
        ) : summary && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-fade-in">
            {/* Executive Summary */}
            <div className="md:col-span-2 bg-white rounded-2xl p-6 border border-gray-100 shadow-card">
              <h2 className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                <FileText size={14} /> Executive Summary
              </h2>
              <p className="text-gray-700 leading-relaxed text-[15px]">{summary.summary}</p>
            </div>

            {/* Key Points */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-card">
              <h2 className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Target size={14} /> Key Decisions & Points
              </h2>
              {summary.key_points && summary.key_points.length > 0 ? (
                <ul className="space-y-3">
                  {summary.key_points.map((pt, idx) => (
                    <li key={idx} className="flex gap-2.5 items-start">
                      <span className="mt-2 h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                      <span className="text-gray-600 text-sm leading-relaxed">{pt}</span>
                    </li>
                  ))}
                  {summary.decisions && summary.decisions.map((dec, idx) => (
                    <li key={`dec-${idx}`} className="flex gap-2.5 items-start">
                      <span className="mt-2 h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0" />
                      <span className="text-gray-700 text-sm font-medium leading-relaxed">{dec}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-400 italic text-sm">No critical points extracted.</p>
              )}
            </div>

            {/* Action Items */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-card">
              <h2 className="text-xs font-bold text-amber-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                <CheckSquare size={14} /> Action Items
              </h2>
              {summary.action_items && summary.action_items.length > 0 ? (
                <ul className="space-y-2.5">
                  {summary.action_items.map((item, idx) => (
                    <li key={idx} className="flex gap-2.5 items-start bg-amber-50 px-3 py-2.5 rounded-xl border border-amber-100">
                      <CheckSquare size={14} className="text-amber-500 mt-0.5 shrink-0" />
                      <span className="text-gray-600 text-sm leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-400 italic text-sm">No action items detected.</p>
              )}
            </div>
          </div>
        )}

        {/* Full Transcript Log */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden flex flex-col h-[500px]">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/70 flex justify-between items-center sticky top-0">
            <h2 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
              <MessageSquare size={15} className="text-blue-500" /> Full Transcript History
            </h2>
            <span className="text-xs font-mono text-gray-400 bg-white border border-gray-200 px-2 py-1 rounded-lg">
              {captions.length} segments
            </span>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {captions.map((c, i) => (
              <div key={i} className="flex flex-col gap-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-blue-600 font-semibold text-sm">{c.speaker}</span>
                  {c.timestamp && (
                    <span className="text-[11px] text-gray-400">
                      {new Date(c.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
                <p className="text-gray-600 text-[14px] leading-relaxed bg-gray-50 border border-gray-100 px-3 py-2 rounded-xl">
                  {c.text}
                </p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </main>
  );
}
