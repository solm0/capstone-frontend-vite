import { useEffect, useRef, useState } from "react";

export default function AudioCapture() {
  const wsRef = useRef<WebSocket | null>(null);
  const [finalTexts, setFinalTexts] = useState<string[]>([]);
  const [partialText, setPartialText] = useState("");

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8000/ws/stt");
    wsRef.current = ws;

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);

      if (msg.type === "partial") {
        setPartialText(msg.text);
      }

      if (msg.type === "final") {
        setFinalTexts((prev) => [...prev, msg.text]);
        setPartialText(""); // partial 초기화
      }
    };

    return () => ws.close();
  }, []);

  const start = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
    });

    const audioContext = new AudioContext({ sampleRate: 16000 });

    await audioContext.audioWorklet.addModule("/worklet.js");

    const source = audioContext.createMediaStreamSource(stream);
    const workletNode = new AudioWorkletNode(
      audioContext,
      "pcm-processor"
    );

    source.connect(workletNode);
    workletNode.connect(audioContext.destination);

    workletNode.port.onmessage = (event) => {
      const float32 = event.data;

      // float32 → int16 PCM
      const int16 = new Int16Array(float32.length);
      for (let i = 0; i < float32.length; i++) {
        int16[i] = Math.max(-1, Math.min(1, float32[i])) * 0x7fff;
      }

      const buffer = int16.buffer;
      const base64 = btoa(
        String.fromCharCode(...new Uint8Array(buffer))
      );

      wsRef.current?.send(
        JSON.stringify({
          type: "audio",
          data: base64,
        })
      );
    };
  };

  return (
    <div>
      <button onClick={start}>Start</button>

      <div>
        {finalTexts.map((t, i) => (
          <div key={i}>{t}</div>
        ))}

        <span>{partialText}</span>
      </div>
    </div>
  );
}