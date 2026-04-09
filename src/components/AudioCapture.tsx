import { useEffect, useRef, useState } from "react";

export default function AudioCapture() {
  const wsRef = useRef<WebSocket | null>(null);
  const [finalTexts, setFinalTexts] = useState<string[]>([]);
  const [partialText, setPartialText] = useState("");

  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const workletRef = useRef<AudioWorkletNode | null>(null);

  const [isRecording, setIsRecording] = useState(false);

  const connectWS = () => {
    const ws = new WebSocket("ws://localhost:8000/ws/stt");

    ws.onopen = () => {
      console.log("WS connected");
    };

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);

      if (msg.type === "partial") {
        setPartialText(msg.text);
      }

      if (msg.type === "final") {
        setFinalTexts((prev) => [...prev, msg.text]);
        setPartialText("");
      }
    };

    ws.onclose = () => {
      console.log("WS closed");
    };

    wsRef.current = ws;
  };

  const start = async () => {
    if (isRecording) return;

    connectWS();

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
    });

    streamRef.current = stream;

    const audioContext = new AudioContext({ sampleRate: 16000 });
    audioContextRef.current = audioContext;

    await audioContext.audioWorklet.addModule("/worklet.js");

    const source = audioContext.createMediaStreamSource(stream);
    const workletNode = new AudioWorkletNode(audioContext, "pcm-processor");

    workletRef.current = workletNode;

    source.connect(workletNode);
    workletNode.connect(audioContext.destination);

    workletNode.port.onmessage = (event) => {
      const ws = wsRef.current;
      if (!ws || ws.readyState !== WebSocket.OPEN) return;
      
      const float32 = event.data;

      const int16 = new Int16Array(float32.length);
      for (let i = 0; i < float32.length; i++) {
        int16[i] = Math.max(-1, Math.min(1, float32[i])) * 0x7fff;
      }

      const base64 = btoa(
        String.fromCharCode(...new Uint8Array(int16.buffer))
      );

      ws.send(JSON.stringify({ type: "audio", data: base64 }));
    };
  };

  const stop = () => {
    if (!isRecording) return;

    // 1. 마이크 끄기
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    // 2. 오디오 처리 중단
    workletRef.current?.disconnect();
    workletRef.current = null;

    // 3. AudioContext 종료
    audioContextRef.current?.close();
    audioContextRef.current = null;

    // 4. (선택) WebSocket 유지 or 종료
    wsRef.current?.close();
    wsRef.current = null;
  };

  const handleClick = async () => {
    if (isRecording) {
      stop();
      setIsRecording(false);
    } else {
      await start();
      setIsRecording(true);
    }
  };

  return (
    <div>
      <button onClick={handleClick}>
        {isRecording ? "Stop" : "Start"}
      </button>

      <div>
        {finalTexts.map((t, i) => (
          <div key={i}>{t}</div>
        ))}

        <span>{partialText}</span>
      </div>
    </div>
  );
}