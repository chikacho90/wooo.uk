"use client";

import { useEffect, useRef, useState } from "react";

interface SpeechRecognitionAlternative {
  transcript: string;
}

interface SpeechRecognitionResult {
  0: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionEventLike extends Event {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResult>;
}

interface SpeechRecognitionErrorEventLike extends Event {
  error: string;
}

interface SpeechRecognitionInstance {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult:
    | ((this: SpeechRecognitionInstance, ev: SpeechRecognitionEventLike) => void)
    | null;
  onerror:
    | ((
        this: SpeechRecognitionInstance,
        ev: SpeechRecognitionErrorEventLike,
      ) => void)
    | null;
  onend: ((this: SpeechRecognitionInstance) => void) | null;
  start(): void;
  stop(): void;
}

interface SpeechRecognitionCtor {
  new (): SpeechRecognitionInstance;
}

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  }
}

interface PromptInputProps {
  onSubmit: (text: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

// TUNE ME: copy in placeholder + send-button label, focus accent color.
export default function PromptInput({
  onSubmit,
  disabled = false,
  placeholder,
}: PromptInputProps) {
  const [text, setText] = useState("");
  const [listening, setListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const recRef = useRef<SpeechRecognitionInstance | null>(null);
  const baseTextRef = useRef("");

  useEffect(() => {
    const SR = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    setVoiceSupported(Boolean(SR));
  }, []);

  function startListening() {
    const SR = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!SR || disabled) return;

    baseTextRef.current = text ? `${text} ` : "";
    const rec = new SR();
    rec.lang = "ko-KR";
    rec.continuous = true;
    rec.interimResults = true;

    rec.onresult = (e) => {
      let combined = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        combined += e.results[i][0].transcript;
      }
      setText(baseTextRef.current + combined);
    };
    rec.onend = () => {
      setListening(false);
      recRef.current = null;
    };
    rec.onerror = () => {
      setListening(false);
      recRef.current = null;
    };

    rec.start();
    recRef.current = rec;
    setListening(true);
  }

  function stopListening() {
    recRef.current?.stop();
  }

  function submit() {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    if (listening) stopListening();
    onSubmit(trimmed);
    setText("");
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="flex w-full items-center gap-2"
    >
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder ?? "Bumblebee에게 말 걸기…"}
        disabled={disabled}
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
        className="flex-1 border-b border-white/20 bg-transparent px-2 py-2 font-mono text-sm text-white/85 placeholder:text-white/25 transition-colors focus:border-amber-300/60 focus:outline-none disabled:opacity-40"
      />
      {voiceSupported && (
        <button
          type="button"
          onClick={listening ? stopListening : startListening}
          disabled={disabled}
          aria-label={listening ? "stop voice input" : "start voice input"}
          className={`flex h-9 w-9 items-center justify-center rounded-full border transition-colors disabled:opacity-30 ${
            listening
              ? "animate-pulse border-amber-300/60 bg-amber-300/10 text-amber-300"
              : "border-white/15 text-white/50 hover:border-white/30 hover:text-white/80"
          }`}
        >
          <svg width="14" height="18" viewBox="0 0 14 18" fill="currentColor" aria-hidden>
            <path d="M7 11.5a3 3 0 0 0 3-3v-5a3 3 0 0 0-6 0v5a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H1a6 6 0 0 0 5 5.92V18h2v-3.58A6 6 0 0 0 13 8.5z" />
          </svg>
        </button>
      )}
      <button
        type="submit"
        disabled={disabled || !text.trim()}
        className="rounded-full border border-white/15 px-4 py-2 font-mono text-xs uppercase tracking-[0.25em] text-white/60 transition-colors hover:border-amber-300/40 hover:text-amber-200 disabled:opacity-30"
      >
        send
      </button>
    </form>
  );
}
