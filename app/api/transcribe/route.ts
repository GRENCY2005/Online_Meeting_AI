import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {

    const formData = await req.formData();
    const audioFile = formData.get("audio") as File;

    if (!audioFile) {
      return NextResponse.json({ error: "No audio file uploaded" }, { status: 400 });
    }

    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const deepgramKey = process.env.DEEPGRAM_API_KEY;

    const response = await fetch(
      "https://api.deepgram.com/v1/listen?punctuate=true&diarize=true",
      {
        method: "POST",
        headers: {
          Authorization: `Token ${deepgramKey}`,
          "Content-Type": "audio/webm"
        },
        body: buffer
      }
    );

    const data = await response.json();

    const transcript =
      data.results?.channels?.[0]?.alternatives?.[0]?.transcript;

    return NextResponse.json({ transcript });

  } catch (error) {
    console.error("Deepgram Error:", error);
    return NextResponse.json({ error: "Transcription failed" }, { status: 500 });
  }
}