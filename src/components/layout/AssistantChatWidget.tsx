import { useState, useEffect, useRef, useCallback } from "react";
import { X, Send, Mic, MicOff, Sparkles, MessageSquareCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSettings } from "@/context/settings";
import { useGarageData } from "@/context/garage-data";
import { parseAssistantCommand, type ParsedAssistantCommand } from "@/services/assistantService";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export interface AssistantChatWidgetProps {
  open: boolean;
  onClose: () => void;
  onParseComplete: (parsed: ParsedAssistantCommand) => void;
}

interface Message {
  id: string;
  sender: "user" | "assistant";
  text: string;
  options?: { label: string; action: string }[];
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognitionResult {
  transcript: string;
}

interface SpeechRecognitionResultList {
  [index: number]: {
    [index: number]: SpeechRecognitionResult;
  };
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: () => void;
  onerror: (e: SpeechRecognitionErrorEvent) => void;
  onend: () => void;
  onresult: (event: SpeechRecognitionEvent) => void;
  start: () => void;
  stop: () => void;
}

interface SpeechWindow extends Window {
  SpeechRecognition?: new () => SpeechRecognitionInstance;
  webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
}

const SpeechRecognition =
  typeof window !== "undefined"
    ? (window as unknown as SpeechWindow).SpeechRecognition ||
      (window as unknown as SpeechWindow).webkitSpeechRecognition
    : null;

export function AssistantChatWidget({
  open,
  onClose,
  onParseComplete,
}: AssistantChatWidgetProps) {
  const { language, t } = useSettings();
  const { vehicles } = useGarageData();
  const { toast } = useToast();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recognition, setRecognition] = useState<SpeechRecognitionInstance | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  const handleSendCommand = useCallback(async (text: string) => {
    if (!text.trim()) return;

    // Add user message
    const userMsgId = `user-${Date.now()}`;
    setMessages((prev) => [...prev, { id: userMsgId, sender: "user", text }]);

    setInputValue("");
    setIsProcessing(true);

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("Missing Gemini API Key in configurations.");
      }

      // Call assistant parse service
      const parsed = await parseAssistantCommand(text, vehicles, apiKey);
      
      setIsProcessing(false);

      // Trigger confirmation dialog
      onParseComplete(parsed);

      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          sender: "assistant",
          text: t("assistant.processing") + " Complete. Verification popup shown.",
        },
      ]);
    } catch (error) {
      console.error(error);
      setIsProcessing(false);
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-err-${Date.now()}`,
          sender: "assistant",
          text: t("assistant.error"),
        },
      ]);
    }
  }, [vehicles, onParseComplete, t]);

  // Initialize Speech Recognition
  useEffect(() => {
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = language === "pl" ? "pl-PL" : "en-US";

      rec.onstart = () => {
        setIsListening(true);
      };

      rec.onerror = (e) => {
        console.error("Speech recognition error", e);
        setIsListening(false);
        toast({
          title: t("assistant.error"),
          description: e.error || "",
          variant: "destructive",
        });
      };

      rec.onend = () => {
        setIsListening(false);
      };

      rec.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          handleSendCommand(transcript);
        }
      };

      setRecognition(rec);
    }
  }, [language, t, toast, handleSendCommand]);

  // Set initial welcome message
  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([
        {
          id: "welcome",
          sender: "assistant",
          text: t("assistant.welcome"),
          options: [
            { label: t("assistant.btn.receipt"), action: "receipt_hint" },
            { label: t("assistant.btn.maintenance"), action: "maintenance_hint" },
          ],
        },
      ]);
    }
  }, [open, messages.length, t]);

  // Auto scroll to bottom when messages list changes
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isProcessing]);

  if (!open) return null;


  const handleOptionClick = (action: string) => {
    if (action === "receipt_hint") {
      setMessages((prev) => [
        ...prev,
        {
          id: `receipt-hint-${Date.now()}`,
          sender: "assistant",
          text: language === "pl"
            ? "Wpisz lub powiedz szczegóły wydatku, np.:\n• *\"dodaj do samochodu z rejestracją kbc1246 fakturę za paliwo kwota 1350\"*\n• *\"faktura za części 450 zł dla Toyota\"*"
            : "Type or speak expense details, e.g.:\n• *\"add fuel receipt 150 USD to vehicle brand BMW\"*\n• *\"add parts receipt amount 450 for Tesla TS-3204\"*",
        },
      ]);
    } else if (action === "maintenance_hint") {
      setMessages((prev) => [
        ...prev,
        {
          id: `maintenance-hint-${Date.now()}`,
          sender: "assistant",
          text: language === "pl"
            ? "Wpisz lub powiedz szczegóły serwisu, np.:\n• *\"przypomnienie o zbliżającym się przeglądzie samochodu bmw na 20 czerwca\"*\n• *\"planowana wymiana oleju dla Toyota 25 lipca koszt 300 zł\"*"
            : "Type or speak service reminder details, e.g.:\n• *\"reminder for technical inspection for Ford on June 20\"*\n• *\"upcoming oil change for BMW on July 25 cost 150\"*",
        },
      ]);
    }
  };

  const toggleListening = () => {
    if (!recognition) {
      toast({
        title: t("assistant.noSpeech"),
        variant: "destructive",
      });
      return;
    }

    if (isListening) {
      recognition.stop();
    } else {
      try {
        recognition.start();
      } catch (err) {
        console.error("Failed to start speech recognition", err);
      }
    }
  };

  return (
    <div
      className={cn(
        "fixed bottom-24 right-6 w-96 h-[520px] max-w-[calc(100vw-2rem)] rounded-2xl flex flex-col z-50 overflow-hidden",
        "bg-card/90 backdrop-blur-xl border border-border/80 shadow-2xl animate-fade-in"
      )}
      role="dialog"
      aria-label={t("assistant.title")}
    >
      {/* Header */}
      <div className="px-4 py-3 bg-gradient-primary text-primary-foreground flex items-center justify-between shadow-sm shrink-0">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 animate-pulse" />
          <div>
            <h2 className="font-display font-semibold text-sm leading-none">
              {t("assistant.title")}
            </h2>
            <span className="text-[10px] opacity-75">Gemini 2.5 Flash</span>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-primary-foreground hover:bg-white/10 rounded-full"
          onClick={onClose}
          aria-label="Close assistant"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Chat Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-secondary/15 select-text"
      >
        {messages.map((msg) => (
          <div key={msg.id} className="space-y-2">
            <div
              className={cn(
                "flex w-full items-start gap-2.5",
                msg.sender === "user" ? "justify-end" : "justify-start"
              )}
            >
              {msg.sender === "assistant" && (
                <div className="h-7 w-7 rounded-lg bg-primary/15 text-primary grid place-items-center shrink-0">
                  <MessageSquareCode className="h-4 w-4" />
                </div>
              )}
              <div
                className={cn(
                  "max-w-[75%] rounded-2xl px-3.5 py-2.5 text-sm whitespace-pre-line shadow-sm",
                  msg.sender === "user"
                    ? "bg-primary text-primary-foreground rounded-tr-none"
                    : "bg-card text-foreground border border-border/40 rounded-tl-none"
                )}
              >
                {msg.text}
              </div>
            </div>

            {/* Wizard interactive options */}
            {msg.sender === "assistant" && msg.options && (
              <div className="flex flex-wrap gap-2 pl-9">
                {msg.options.map((opt, i) => (
                  <Button
                    key={i}
                    variant="outline"
                    size="sm"
                    className="h-8 rounded-full text-xs hover:bg-primary/5 hover:border-primary border-border bg-card/60"
                    onClick={() => handleOptionClick(opt.action)}
                  >
                    {opt.label}
                  </Button>
                ))}
              </div>
            )}
          </div>
        ))}

        {isProcessing && (
          <div className="flex w-full items-start gap-2.5 justify-start">
            <div className="h-7 w-7 rounded-lg bg-primary/15 text-primary grid place-items-center shrink-0">
              <MessageSquareCode className="h-4 w-4" />
            </div>
            <div className="bg-card text-foreground border border-border/40 rounded-2xl rounded-tl-none px-3.5 py-2.5 shadow-sm text-sm flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-primary/80 animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="h-2 w-2 rounded-full bg-primary/80 animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="h-2 w-2 rounded-full bg-primary/80 animate-bounce" style={{ animationDelay: "300ms" }} />
              <span className="ml-1 text-xs text-muted-foreground">{t("assistant.processing")}</span>
            </div>
          </div>
        )}
      </div>

      {/* Dictation Listening Indicator */}
      {isListening && (
        <div className="px-4 py-2.5 bg-destructive/10 border-t border-destructive/20 text-destructive text-xs font-medium flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive"></span>
            </span>
            <span>{t("assistant.listening")}</span>
          </div>
          <div className="flex items-center gap-1.5 opacity-80 animate-pulse">
            <div className="h-3 w-0.5 bg-destructive rounded-full" />
            <div className="h-5 w-0.5 bg-destructive rounded-full" />
            <div className="h-2 w-0.5 bg-destructive rounded-full" />
            <div className="h-4 w-0.5 bg-destructive rounded-full" />
          </div>
        </div>
      )}

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendCommand(inputValue);
        }}
        className="p-3 border-t border-border bg-card flex items-center gap-2 shrink-0"
      >
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={toggleListening}
          className={cn(
            "h-10 w-10 shrink-0 rounded-xl transition-all duration-300",
            isListening
              ? "bg-destructive text-destructive-foreground hover:bg-destructive/90 border-destructive shadow-lg animate-pulse"
              : "hover:bg-primary/10 text-muted-foreground hover:text-primary"
          )}
          title={recognition ? "Click to speak" : t("assistant.noSpeech")}
        >
          {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
        </Button>
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={t("assistant.placeholder")}
          className="flex-1 h-10 bg-secondary/35 border-transparent focus-visible:border-border/60 focus-visible:bg-card text-sm"
          disabled={isProcessing || isListening}
        />
        <Button
          type="submit"
          size="icon"
          className="h-10 w-10 shrink-0 bg-gradient-primary text-primary-foreground rounded-xl shadow-glow"
          disabled={!inputValue.trim() || isProcessing || isListening}
        >
          <Send className="h-4.5 w-4.5" />
        </Button>
      </form>
    </div>
  );
}
