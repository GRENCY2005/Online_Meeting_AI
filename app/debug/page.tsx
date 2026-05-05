"use client";

import AudioTest from "@/components/AudioTest";

export default function DebugPage() {
  return (
    <div style={{ padding: 40, background: "black", minHeight: "100vh" }}>
      <h1 style={{ color: "white" }}>DEBUG AUDIO PAGE</h1>

      <AudioTest />
    </div>
  );
}