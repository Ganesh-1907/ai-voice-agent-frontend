import { useMemo, useRef, useState } from "react";

import { api } from "../api";
import type { Business, CallRecord } from "../types";

type ChatMessage = {
  speaker: "agent" | "customer";
  text: string;
};

type Props = {
  business: Business;
  onCallCompleted: (call: CallRecord) => Promise<void>;
};

export function TestCallPanel({ business, onCallCompleted }: Props) {
  const [callId, setCallId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [customerText, setCustomerText] = useState("");
  const [status, setStatus] = useState("Idle");
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const loopRunningRef = useRef(false);
  const sessionActiveRef = useRef(false);
  const activeCallIdRef = useRef<string | null>(null);
  const speakingRef = useRef(false);

  const speechReady = useMemo(
    () => typeof window !== "undefined" && navigator.mediaDevices?.getUserMedia !== undefined && typeof window.MediaRecorder !== "undefined",
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

  async function startSession() {
    setLoading(true);
    setStatus("Starting test call...");
    try {
      const response = await api.startTestCall(business.id);
      setCallId(response.callId);
      activeCallIdRef.current = response.callId;
      sessionActiveRef.current = true;
      setMessages([{ speaker: "agent", text: response.greeting }]);
      setStatus("Agent speaking...");
      await speak(response.greeting);
      setStatus(`${response.note} Listening for your voice...`);
      void startAutoConversationLoop(response.callId);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to start test call");
    } finally {
      setLoading(false);
    }
  }

  async function sendCustomerTurn(text: string) {
    const currentCallId = activeCallIdRef.current;
    if (!currentCallId || !text.trim()) {
      return;
    }

    setStatus("AI is responding...");
    setMessages((current) => [...current, { speaker: "customer", text }]);

    try {
      const response = await api.testCallTurn(currentCallId, business.id, text);
      setMessages((current) => [...current, { speaker: "agent", text: response.aiReply.replyText }]);
      setStatus("Agent speaking...");
      await speak(response.aiReply.replyText);
      setStatus("Reply delivered. Listening again...");
      setCustomerText("");
      return response.aiReply.replyText;
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to send turn");
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
        const silenceAfterSpeechMs = 3000;

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

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
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

        setStatus("Transcribing with Whisper...");
        const transcription = await api.transcribeTestCallAudio(business.id, blob);
        const text = transcription.text?.trim() ?? "";

        if (!text) {
          if (transcription.error) {
            if (transcription.statusCode === 429) {
              setStatus("Whisper rate limit reached (429). Waiting briefly before retry...");
            } else {
              setStatus(`Transcription failed: ${transcription.error}`);
            }
          } else {
            setStatus("Could not transcribe speech. Listening again...");
          }
          continue;
        }

        setCustomerText(text);
        
        // Auto-end call if user says keywords like bye, goodbye, thanks, see you, exit
        const endCallKeywords = ["bye", "goodbye", "thank you", "thanks", "see you", "exit", "quit", "done"];
        const lowerText = text.toLowerCase();
        const shouldEndCall = endCallKeywords.some((keyword) => lowerText.includes(keyword));
        
        if (shouldEndCall) {
          const closingReply = await sendCustomerTurn(text);
          setStatus("Closing call...");
          if (shouldAutoEndAfterAgentReply(closingReply)) {
            await delay(220);
          }
          await delay(400);
          await completeSession();
          return;
        }
        
        const aiReply = await sendCustomerTurn(text);
        if (shouldAutoEndAfterAgentReply(aiReply)) {
          setStatus("Call completed after farewell.");
          await delay(220);
          await completeSession();
          return;
        }
      }
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Auto conversation failed");
    } finally {
      setIsListening(false);
      loopRunningRef.current = false;
    }
  }

  async function completeSession() {
    if (!callId) {
      return;
    }

    setLoading(true);
    setStatus("Closing test call...");
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

      const payload = await api.completeTestCall(callId, { businessId: business.id });
      await onCallCompleted(payload.call);
      setStatus("Test call completed. Analytics updated.");
      setCallId(null);
      setMessages([]);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to complete test call");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="panel-grid test-grid">
      <div className="panel card">
        <div className="panel-head">
          <h3>Voice test call</h3>
          <p>Speak into the mic, let the AI answer out loud, and save the transcript into analytics.</p>
        </div>
        <div className="action-row">
          <button className="primary-button" type="button" onClick={() => void startSession()} disabled={loading || Boolean(callId)}>
            Start test call
          </button>
          <button type="button" onClick={() => void completeSession()} disabled={!callId || loading}>
            End and save
          </button>
        </div>
        {!speechReady ? <p className="muted">Your browser does not support microphone capture for auto conversation.</p> : null}
        <label>
          Typed fallback
          <textarea
            value={customerText}
            onChange={(event) => setCustomerText(event.target.value)}
            placeholder="Auto mode fills this from your voice. You can still edit text manually."
          />
        </label>
        <p className="muted">{status}</p>
      </div>

      <div className="panel card conversation-card">
        <div className="panel-head">
          <h3>Conversation flow</h3>
          <p>Speech-to-text and speech playback both run in the browser for business-side testing.</p>
        </div>
        <div className="chat-stack">
          {messages.map((message, index) => (
            <article key={`${message.speaker}-${index}`} className={`chat-bubble ${message.speaker}`}>
              <span>{message.speaker === "agent" ? "AI agent" : "Customer"}</span>
              <p>{message.text}</p>
            </article>
          ))}
        </div>
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
