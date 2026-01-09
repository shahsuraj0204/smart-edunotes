let recognition: any = null;
let synthesis: SpeechSynthesisUtterance | null = null;
let isContinuousListening = false;

// Clean HTML tags from text for speech
const cleanTextForSpeech = (text: string): string => {
  // Remove HTML tags
  let cleaned = text.replace(/<[^>]*>/g, ' ');
  // Decode HTML entities
  cleaned = cleaned.replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
  // Remove extra whitespace
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  return cleaned;
};

export const startListening = (
  onResult: (text: string) => void,
  onError: (error: string) => void,
  options?: { continuous?: boolean; onEnd?: () => void }
) => {
  // Check if running in browser
  if (typeof window === 'undefined') {
    onError("Voice recognition is only available in the browser");
    return;
  }

  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

  if (!SpeechRecognition) {
    onError("Speech Recognition not supported in this browser. Please use Chrome, Edge, or Safari.");
    return;
  }

  // Stop any existing recognition
  if (recognition) {
    try {
      recognition.stop();
    } catch (e) {
      // Ignore
    }
  }

  try {
    recognition = new SpeechRecognition();
    recognition.continuous = options?.continuous || false;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.maxAlternatives = 1;

    isContinuousListening = options?.continuous || false;

    recognition.onresult = (event: any) => {
      let finalTranscript = "";
      let interimTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      if (finalTranscript) {
        onResult(finalTranscript);
      }
    };

    recognition.onerror = (event: any) => {
      const errorMessages: Record<string, string> = {
        'no-speech': 'No speech detected. Please try again.',
        'aborted': 'Speech recognition was aborted.',
        'audio-capture': 'No microphone found. Please check your microphone.',
        'network': 'Network error occurred. Please check your connection.',
        'not-allowed': 'Microphone access denied. Please allow microphone access in your browser settings.',
        'service-not-allowed': 'Speech recognition service not allowed.',
        'bad-grammar': 'Grammar error in speech recognition.',
        'language-not-supported': 'Language not supported.',
      };

      const message = errorMessages[event.error] || `Speech recognition error: ${event.error}`;

      // Quietly handle no-speech
      if (event.error === 'no-speech') {
        // Just call onError with the quiet message or a flag
        onError('no-speech');
      } else {
        console.error("Voice recognition error:", event.error);
        onError(message);
      }
    };

    recognition.onend = () => {
      if (isContinuousListening && recognition) {
        try {
          recognition.start();
        } catch (e) {
          console.error("Error restarting recognition:", e);
          if (options?.onEnd) options.onEnd();
        }
      } else {
        if (options?.onEnd) options.onEnd();
      }
    };

    recognition.start();
  } catch (error: any) {
    console.error("Error starting recognition:", error);
    onError(error?.message || "Failed to start voice recognition");
  }
};

export const startContinuousListening = (
  onResult: (text: string) => void,
  onError: (error: string) => void
) => {
  startListening(onResult, onError, { continuous: true });
};

export const stopListening = () => {
  isContinuousListening = false;
  if (recognition) {
    try {
      recognition.stop();
      recognition = null;
    } catch (e) {
      console.error("Error stopping recognition:", e);
    }
  }
};

export const isListeningActive = () => {
  return recognition !== null;
};

export const speak = (text: string, onEnd?: () => void) => {
  // Check if running in browser
  if (typeof window === 'undefined') {
    console.error("Speech synthesis is only available in the browser");
    return;
  }

  if (!window.speechSynthesis) {
    console.error("Speech synthesis not supported");
    return;
  }

  // Ensure any previous speech is stopped
  stopSpeaking();

  // Clean HTML from text
  const cleanedText = cleanTextForSpeech(text);

  if (!cleanedText) {
    if (onEnd) onEnd();
    return;
  }

  const utterance = new SpeechSynthesisUtterance(cleanedText);
  utterance.rate = 1;
  utterance.pitch = 1;
  utterance.volume = 1;

  const startSpeaking = () => {
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v =>
      v.name.includes('Google') ||
      v.name.includes('Microsoft') ||
      v.name.includes('Natural')
    ) || voices.find(v => v.lang.startsWith('en'));

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onend = () => {
      synthesis = null;
      if (onEnd) onEnd();
    };

    utterance.onerror = (event: any) => {
      // "interrupted" is common in dev mode/fast switching and shouldn't be treated as a hard error
      if (event.error !== 'interrupted') {
        console.error("Speech synthesis error:", event);
      }
      synthesis = null;
      if (onEnd) onEnd();
    };

    synthesis = utterance;
    window.speechSynthesis.speak(utterance);
  };

  // On some browsers, voices are loaded asynchronously.
  // If getVoices() is empty, we wait for the voiceschanged event.
  if (window.speechSynthesis.getVoices().length > 0) {
    // Small delay to ensure the cancel() from stopSpeaking() has settled
    setTimeout(startSpeaking, 50);
  } else {
    window.speechSynthesis.onvoiceschanged = () => {
      window.speechSynthesis.onvoiceschanged = null;
      setTimeout(startSpeaking, 50);
    };
  }
};

export const stopSpeaking = () => {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
  synthesis = null;
};

export const isSpeaking = () => {
  if (typeof window === 'undefined') return false;
  return window.speechSynthesis?.speaking || false;
};