"use client";

import { useRef, useState } from "react";

export default function AudioTest() {
  console.log("🔥 AudioTest loaded");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const [audioURL, setAudioURL] = useState<string>("");

  const startRecording = async () => {
    console.log("🎤 startRecording called");

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorderRef.current = mediaRecorder;

    audioChunks.current = [];

    mediaRecorder.ondataavailable = (event) => {
      console.log("DATA CHUNK:", event.data.size);
      if (event.data.size > 0) {
        audioChunks.current.push(event.data);
      }
    };

    mediaRecorder.start();
  };

  const stopRecording = () => {
    console.log("🛑 stopRecording called");

    mediaRecorderRef.current?.stop();

    mediaRecorderRef.current!.onstop = () => {
      console.log("STOP EVENT TRIGGERED");

      const blob = new Blob(audioChunks.current, { type: "audio/webm" });

      console.log("Blob size:", blob.size);
      console.log("Chunks:", audioChunks.current.length);

      if (blob.size === 0) {
        alert("❌ Audio NOT recorded");
        return;
      }

      const url = URL.createObjectURL(blob);
      setAudioURL(url);
    };
  };

  return (
    <div style={{ background: "black", padding: 20 }}>
      <h2 style={{ color: "white" }}>AUDIO TEST</h2>

      <button
        onClick={() => {
          console.log("START CLICKED");
          startRecording();
        }}
        style={{ background: "green", padding: 10, marginRight: 10 }}
      >
        Start
      </button>

      <button
        onClick={() => {
          console.log("STOP CLICKED");
          stopRecording();
        }}
        style={{ background: "red", padding: 10 }}
      >
        Stop
      </button>

      {audioURL && (
        <div>
          <p style={{ color: "white" }}>Playback:</p>
          <audio controls src={audioURL}></audio>
        </div>
      )}
    </div>
  );
}