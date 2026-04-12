import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";

export type AudioCaptureHandle = {
  start: () => Promise<void>;
  stop: () => void;
  isRecording: () => boolean;
};

type AudioCaptureProps = {
  onFinalText?: (text: string) => void;
  onPartialText?: (text: string) => void;
  autoStart?: boolean;
  showControls?: boolean;
  showTranscripts?: boolean;
  resetKey?: number;
};

const AudioCapture = forwardRef<AudioCaptureHandle, AudioCaptureProps>(function AudioCapture(
  {
    onFinalText,
    onPartialText,
    autoStart = false,
    showControls = true,
    showTranscripts = true,
    resetKey,
  },
  ref
) {
  const wsRef = useRef<WebSocket | null>(null);
  const [finalTexts, setFinalTexts] = useState<string[]>([]);
  const [partialText, setPartialText] = useState("");

  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const workletRef = useRef<AudioWorkletNode | null>(null);

  const [isRecording, setIsRecording] = useState(false);

  useEffect(() => {
    if (resetKey === undefined) return;
    setFinalTexts([]);
    setPartialText("");
  }, [resetKey]);

  const connectWS = () => {
    const ws = new WebSocket("ws://localhost:8000/ws/stt");

    ws.onopen = () => {
      console.log("WS connected");
    };

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);

      if (msg.type === "partial") {
        setPartialText(msg.text);
        onPartialText?.(msg.text);
      }

      if (msg.type === "final") {
        setFinalTexts((prev) => [...prev, msg.text]);
        setPartialText("");
        onFinalText?.(msg.text);
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

    setIsRecording(true);
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

    setIsRecording(false);
  };

  const handleClick = async () => {
    if (isRecording) {
      stop();
    } else {
      await start();
    }
  };

  useEffect(() => {
    if (!autoStart || isRecording) return;
    start();
  }, [autoStart, isRecording]);

  useImperativeHandle(ref, () => ({
    start,
    stop,
    isRecording: () => isRecording,
  }));

  return (
    <div>
      {showControls && (
        <button onClick={handleClick}>
          {isRecording ? "Stop" : "Start"}
        </button>
      )}

      {showTranscripts && (
        <div>
          {finalTexts.map((t, i) => (
            <div key={i}>{t}</div>
          ))}

          <span>{partialText}</span>
        </div>
      )}
    </div>
  );
});

export default AudioCapture;
