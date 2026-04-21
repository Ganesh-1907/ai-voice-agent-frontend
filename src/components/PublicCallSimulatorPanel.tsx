import { FormEvent, useMemo, useRef, useState } from "react";

import { ApiError, api } from "../api";
import type { CallRecord } from "../types";

type ConversationTurn = {
  speaker: "customer" | "agent";
  text: string;
};

export function PublicCallSimulatorPanel() {
  const [fromNumber, setFromNumber] = useState("");
  const [toNumber, setToNumber] = useState("");
  const [callId, setCallId] = useState<string | null>(null);
  const [businessName, setBusinessName] = useState<string | null>(null);
  const [customerText, setCustomerText] = useState("");
  const [turns, setTurns] = useState<ConversationTurn[]>([]);
  const [status, setStatus] = useState("Idle");
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [lastCall, setLastCall] = useState<CallRecord | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const loopRunningRef = useRef(false);
  const sessionActiveRef = useRef(false);
  const activeCallIdRef = useRef<string | null>(null);
  const speakingRef = useRef(false);

  const speechReady = useMemo(
    () =>
      typeof window !== "undefined" &&
      navigator.mediaDevices?.getUserMedia !== undefined &&
      typeof window.MediaRecorder !== "undefined",
    [],
  );

  async function speak(text: string) {
    if (!("speechSynthesis" in window)) {
      return;
    }

    await new Promise<void>((resolve) => {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1;
      utterance.pitch = 1;
      speakingRef.current = true;
      utterance.onend = () => {
        speakingRef.current = false;
        resolve();
      };
      utterance.onerror = () => {
        speakingRef.current = false;
        resolve();
      };
      window.speechSynthesis.speak(utterance);
    });
  }

  async function delay(ms: number) {
    await new Promise<void>((resolve) => {
      setTimeout(resolve, ms);
    });
  }

  async function handleStart(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    try {
      const started = await api.startPublicCall({ fromNumber, toNumber });
      setCallId(started.callId);
      activeCallIdRef.current = started.callId;
      sessionActiveRef.current = true;
      setBusinessName(started.businessName);
      setTurns([{ speaker: "agent", text: started.greeting }]);
      setLastCall(null);
      setStatus(`Connected to ${started.businessName}. Agent speaking...`);
      await speak(started.greeting);
      setStatus("Listening... speak naturally.");
      void startAutoConversationLoop(started.callId);
    } catch (error) {
      setStatus(formatError(error));
    } finally {
      setLoading(false);
    }
  }

  async function sendCustomerTurn(text: string) {
    const currentCallId = activeCallIdRef.current;
    if (!currentCallId || !text.trim()) {
      return;
    }

    const input = text.trim();
    setCustomerText("");
    setTurns((current) => [...current, { speaker: "customer", text: input }]);

    try {
      setStatus("AI is responding...");
      const response = await api.publicCallTurn(currentCallId, input);
      setTurns((current) => [...current, { speaker: "agent", text: response.aiReply.replyText }]);
      setStatus("Agent speaking...");
      await speak(response.aiReply.replyText);
      setStatus("Listening again...");
      return response.aiReply.replyText;
    } catch (error) {
      setStatus(formatError(error));
      return null;
    }
  }

  async function ensureMediaStream() {
    if (mediaStreamRef.current) {
      return mediaStreamRef.current;
    }

    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      throw new Error("Microphone recording is not supported in this browser.");
    }

    setStatus("Requesting microphone permission...");
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaStreamRef.current = stream;
    return stream;
  }

  async function captureSingleTurnAudio(stream: MediaStream) {
    return new Promise<{ blob: Blob; speechDetected: boolean }>((resolve) => {
      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = recorder;
      const chunks: BlobPart[] = [];

      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);
      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const startedAt = Date.now();
      let speechDetected = false;
      let lastSpeechAt = startedAt;
      let resolved = false;

      const finalize = (blob: Blob) => {
        if (resolved) {
          return;
        }
        resolved = true;
        void audioContext.close();
        resolve({ blob, speechDetected });
      };

      const stopRecorder = () => {
        if (recorder.state !== "inactive") {
          recorder.stop();
        }
      };

      const interval = setInterval(() => {
        if (!sessionActiveRef.current) {
          clearInterval(interval);
          stopRecorder();
          return;
        }

        analyser.getByteTimeDomainData(dataArray);
        let sumSquares = 0;
        for (const value of dataArray) {
          const centered = value - 128;
          sumSquares += centered * centered;
        }
        const rms = Math.sqrt(sumSquares / dataArray.length);
        const now = Date.now();

        if (rms > 8) {
          speechDetected = true;
          lastSpeechAt = now;
        }

        const maxWaitNoSpeechMs = 4500;
        const maxTurnMs = 14000;
        const silenceAfterSpeechMs = 2000;

        if (!speechDetected && now - startedAt > maxWaitNoSpeechMs) {
          clearInterval(interval);
          stopRecorder();
          return;
        }

        if (speechDetected && now - lastSpeechAt > silenceAfterSpeechMs) {
          clearInterval(interval);
          stopRecorder();
          return;
        }

        if (now - startedAt > maxTurnMs) {
          clearInterval(interval);
          stopRecorder();
        }
      }, 120);

      recorder.ondataavailable = (captureEvent) => {
        if (captureEvent.data.size > 0) {
          chunks.push(captureEvent.data);
        }
      };

      recorder.onerror = () => {
        clearInterval(interval);
        finalize(new Blob([], { type: "audio/webm" }));
      };

      recorder.onstop = () => {
        clearInterval(interval);
        finalize(new Blob(chunks, { type: "audio/webm" }));
      };

      recorder.start(250);
    });
  }

  async function startAutoConversationLoop(startedCallId: string) {
    if (loopRunningRef.current) {
      return;
    }

    loopRunningRef.current = true;
    activeCallIdRef.current = startedCallId;

    try {
      const stream = await ensureMediaStream();

      while (sessionActiveRef.current && activeCallIdRef.current) {
        while (speakingRef.current && sessionActiveRef.current) {
          setIsListening(false);
          setStatus("Agent is speaking...");
          await delay(120);
        }

        setIsListening(true);
        setStatus("Listening... speak naturally.");

        const { blob, speechDetected } = await captureSingleTurnAudio(stream);

        if (!sessionActiveRef.current) {
          break;
        }

        setIsListening(false);

        if (!speechDetected || blob.size === 0) {
          setStatus("No speech detected. Listening again...");
          continue;
        }

        const currentCallId = activeCallIdRef.current;
        if (!currentCallId) {
          break;
        }

        setStatus("Transcribing speech...");
        const transcription = await api.transcribePublicCallAudio(currentCallId, blob);
        const text = transcription.text?.trim() ?? "";

        if (!text) {
          if (transcription.error) {
            if (transcription.statusCode === 429) {
              setStatus("Transcription rate limit reached (429). Waiting briefly before retry...");
            } else {
              setStatus(`Transcription failed: ${transcription.error}`);
            }
          } else {
            setStatus("Could not transcribe speech. Listening again...");
          }
          continue;
        }

        setCustomerText(text);
        const aiReply = await sendCustomerTurn(text);
        if (shouldAutoEndAfterAgentReply(aiReply)) {
          setStatus("Call completed after farewell.");
          await delay(220);
          await handleComplete();
          return;
        }
      }
    } catch (error) {
      setStatus(formatError(error));
    } finally {
      setIsListening(false);
      loopRunningRef.current = false;
    }
  }

  async function handleSendTurn(event: FormEvent) {
    event.preventDefault();
    await sendCustomerTurn(customerText);
  }

  async function handleComplete() {
    const currentCallId = activeCallIdRef.current;
    if (!currentCallId) {
      return;
    }

    setLoading(true);
    try {
      sessionActiveRef.current = false;
      activeCallIdRef.current = null;

      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }

      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      speakingRef.current = false;

      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      }

      const completed = await api.publicCompleteCall(currentCallId);
      setLastCall(completed.call);
      setStatus("Call completed and pushed to business updates.");
      setCallId(null);
    } catch (error) {
      setStatus(formatError(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="panel-grid">
      <div className="panel card">
        <div className="panel-head">
          <h3>Public Call Simulator</h3>
          <p>Voice mode: caller speaks, agent replies, routed by business number just like a real incoming call.</p>
        </div>

        <form className="inline-form" onSubmit={handleStart}>
          <label>
            Caller number
            <input
              value={fromNumber}
              onChange={(event) => setFromNumber(event.target.value)}
              placeholder="+91XXXXXXXXXX"
              disabled={Boolean(callId) || loading}
            />
          </label>
          <label>
            Business number
            <input
              value={toNumber}
              onChange={(event) => setToNumber(event.target.value)}
              placeholder="+91XXXXXXXXXX"
              disabled={Boolean(callId) || loading}
            />
          </label>
          <button type="submit" disabled={Boolean(callId) || loading}>Start Voice Call</button>
          <button type="button" onClick={handleComplete} disabled={!callId || loading}>End and Save</button>
        </form>

        <div className="status-line">{status}{isListening ? " (mic on)" : ""}</div>
        {!speechReady ? <p className="muted">Your browser does not support microphone capture.</p> : null}
        {businessName ? <p className="muted">Connected business: {businessName}</p> : null}
      </div>

      <div className="panel card">
        <div className="panel-head">
          <h3>Conversation</h3>
          <p>You can still type if needed, but voice loop runs automatically once started.</p>
        </div>

        <div className="transcript-list">
          {turns.length === 0 ? <p className="muted">No conversation yet.</p> : null}
          {turns.map((turn, index) => (
            <div key={`${turn.speaker}-${index}`} className={`transcript-turn ${turn.speaker}`}>
              <strong>{turn.speaker === "agent" ? "Agent" : "Customer"}:</strong> {turn.text}
            </div>
          ))}
        </div>

        <form className="inline-form" onSubmit={handleSendTurn}>
          <label>
            Customer says
            <input
              value={customerText}
              onChange={(event) => setCustomerText(event.target.value)}
              placeholder="I need details for this product"
              disabled={!callId}
            />
          </label>
          <button type="submit" disabled={!callId}>Send Turn</button>
        </form>

        {lastCall?.summary ? <p className="muted">Summary: {lastCall.summary}</p> : null}
      </div>
    </section>
  );
}

function shouldAutoEndAfterAgentReply(replyText: string | null) {
  if (!replyText) {
    return false;
  }

  const text = replyText.toLowerCase();
  return (
    text.includes("goodbye") ||
    text.includes("have a great day") ||
    text.includes("thank you for calling")
  );
}

function formatError(error: unknown) {
  if (error instanceof ApiError) {
    return error.message;
  }
  return error instanceof Error ? error.message : "Request failed";
}
