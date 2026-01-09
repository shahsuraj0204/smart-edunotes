"use client"

import { User } from "@supabase/supabase-js"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

import { Fragment, useRef, useState, useTransition } from "react";
import { startListening, speak, stopSpeaking, stopListening } from "@/lib/voiceService";

import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { ArrowUpIcon, MicIcon, StopCircleIcon, Upload, Sparkles, Volume2, VolumeX, Bot, User as UserIcon } from "lucide-react";
import { AskAIAboutNotesActiono } from "@/action/notes";
import { useRouter } from "next/navigation";

type Props = {
    user: User | null;
}

function AskAIButton({ user }: Props) {
    const router = useRouter();

    const [isPending, startTransition] = useTransition();

    const [open, setOpen] = useState(false);
    const [questionText, setQuestionText] = useState("");
    const [questions, setQuestions] = useState<string[]>([]);
    const [responses, setResponses] = useState<string[]>([]);
    const [isListening, setIsListening] = useState(false);
    const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleOnOpenChange = (isOpen: boolean) => {
        if (!user) {
            router.push('/login');
        } else {
            if (isOpen) {
                setQuestionText("");
                setQuestions([]);
                setResponses([]);
                setUploadedFiles([]);
            }
            setOpen(isOpen);
        }
    }

    const textAreaRef = useRef<HTMLTextAreaElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);

    const handleInput = () => {
        const textarea = textAreaRef.current;
        if (!textarea) return;
        textarea.style.height = "auto";
        textarea.style.height = `${textarea.scrollHeight}px`;
    }

    const handleClickInput = () => {
        textAreaRef.current?.focus();
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        setUploadedFiles(prev => [...prev, ...files]);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleRemoveFile = (index: number) => {
        setUploadedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    };

    const handleSubmit = () => {
        if (!questionText.trim() && uploadedFiles.length === 0) return;

        const newQuestions = [...questions, questionText || `Analyzing ${uploadedFiles.length} file(s)`];
        setQuestions(newQuestions);
        setQuestionText("");
        setTimeout(scrollToBottom, 100);

        startTransition(async () => {
            let fileData: any[] = [];
            if (uploadedFiles.length > 0) {
                fileData = await Promise.all(
                    uploadedFiles.map(async (file) => ({
                        name: file.name,
                        type: file.type,
                        content: await fileToBase64(file)
                    }))
                );
            }
            setUploadedFiles([]);

            // Pass fileData to the action
            const response = await AskAIAboutNotesActiono(newQuestions, responses, fileData);

            if (response && typeof response === 'object' && 'errorMessage' in response) {
                console.error(response.errorMessage);
                setResponses((prev) => [...prev, "Sorry, I couldn't process your request at the moment."]);
            } else if (response) {
                setResponses((prev) => [...prev, response]);
            }

            setTimeout(scrollToBottom, 100);
        });
    };

    const handleVoiceInput = () => {
        setIsListening(true);
        startListening(
            (text: string) => {
                setQuestionText(prev => prev + (prev ? " " : "") + text);
            },
            (error: string) => {
                if (error !== 'no-speech') {
                    console.error("Voice input error:", error);
                }
                setIsListening(false);
            },
            { onEnd: () => setIsListening(false) }
        );
    };

    const handleStopListening = () => {
        stopListening();
        setIsListening(false);
    };

    const scrollToBottom = () => {
        contentRef.current?.scrollTo({
            top: contentRef.current.scrollHeight,
            behavior: "smooth"
        });
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleOnOpenChange}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2 hover-lift font-medium">
                    <Sparkles className="h-4 w-4 text-primary" />
                    Ask AI
                </Button>
            </DialogTrigger>
            <DialogContent className="glass-effect flex h-[85vh] max-w-4xl flex-col overflow-hidden border-border/30">
                {/* Header */}
                <DialogHeader className="border-b border-border/30 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl gradient-bg">
                            <Bot className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-semibold">
                                AI Study Assistant
                            </DialogTitle>
                            <DialogDescription className="text-sm">
                                Ask questions about your notes and get instant answers
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                {/* Chat messages */}
                <div ref={contentRef} className="flex-1 overflow-y-auto custom-scrollbar py-4 space-y-4">
                    {questions.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full text-center space-y-4 py-12">
                            <div className="p-4 rounded-2xl bg-primary/10 animate-float">
                                <Sparkles className="h-8 w-8 text-primary" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="font-semibold text-lg">How can I help you today?</h3>
                                <p className="text-sm text-muted-foreground max-w-sm">
                                    Ask me anything about your notes. I can summarize, explain concepts, or answer questions.
                                </p>
                            </div>
                        </div>
                    )}

                    {questions.map((question, index) => (
                        <Fragment key={index}>
                            {/* User message */}
                            <div className="flex justify-end">
                                <div className="flex items-start gap-2 max-w-[75%]">
                                    <div className="message-bubble user">
                                        {question}
                                    </div>
                                    <div className="p-1.5 rounded-full bg-primary/20 shrink-0 mt-1">
                                        <UserIcon className="h-3 w-3 text-primary" />
                                    </div>
                                </div>
                            </div>

                            {/* AI response */}
                            {responses[index] && (
                                <div className="flex justify-start">
                                    <div className="flex items-start gap-2 max-w-[75%]">
                                        <div className="p-1.5 rounded-full gradient-bg shrink-0 mt-1">
                                            <Bot className="h-3 w-3 text-white" />
                                        </div>
                                        <div className="space-y-2">
                                            <div
                                                className="message-bubble ai prose prose-sm dark:prose-invert max-w-none"
                                                dangerouslySetInnerHTML={{ __html: responses[index] }}
                                            />
                                            <div className="flex gap-1">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => speak(responses[index])}
                                                    className="h-7 px-2 text-xs gap-1 hover:bg-primary/10"
                                                >
                                                    <Volume2 className="h-3 w-3" />
                                                    Listen
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={stopSpeaking}
                                                    className="h-7 px-2 text-xs gap-1 hover:bg-destructive/10"
                                                >
                                                    <VolumeX className="h-3 w-3" />
                                                    Stop
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </Fragment>
                    ))}

                    {/* Thinking indicator */}
                    {isPending && (
                        <div className="flex justify-start">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 rounded-full gradient-bg shrink-0">
                                    <Bot className="h-3 w-3 text-white" />
                                </div>
                                <div className="message-bubble ai">
                                    <div className="typing-dots">
                                        <span></span>
                                        <span></span>
                                        <span></span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Input area */}
                <div
                    className="mt-auto border-t border-border/30 pt-4"
                    onClick={handleClickInput}
                >
                    {/* Uploaded files */}
                    {uploadedFiles.length > 0 && (
                        <div className="mb-3 flex flex-wrap gap-2">
                            {uploadedFiles.map((file, index) => (
                                <div
                                    key={index}
                                    className="flex items-center gap-2 bg-accent/50 rounded-lg px-3 py-1.5 text-xs"
                                >
                                    <span className="truncate max-w-[150px]">{file.name}</span>
                                    <button
                                        onClick={() => handleRemoveFile(index)}
                                        className="text-destructive hover:text-destructive/80 transition-colors"
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Input box */}
                    <div className="flex items-end gap-2 rounded-xl border border-border/50 bg-background/50 p-3 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                        <Textarea
                            ref={textAreaRef}
                            placeholder="Type your question..."
                            className="flex-1 resize-none border-0 bg-transparent p-0 text-sm shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                            style={{
                                minHeight: "0",
                                lineHeight: "1.5",
                            }}
                            rows={1}
                            onInput={handleInput}
                            onKeyDown={handleKeyDown}
                            value={questionText}
                            onChange={(e) => setQuestionText(e.target.value)}
                        />

                        <div className="flex gap-1.5 shrink-0">
                            <input
                                ref={fileInputRef}
                                type="file"
                                multiple
                                accept="image/*,.pdf,.doc,.docx,.txt"
                                onChange={handleFileUpload}
                                className="hidden"
                            />
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => fileInputRef.current?.click()}
                                className="h-8 w-8 p-0"
                            >
                                <Upload className="h-4 w-4" />
                            </Button>

                            {isListening ? (
                                <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={handleStopListening}
                                    className="h-8 w-8 p-0 animate-pulse"
                                >
                                    <StopCircleIcon className="h-4 w-4" />
                                </Button>
                            ) : (
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={handleVoiceInput}
                                    disabled={isListening}
                                    className="h-8 w-8 p-0"
                                >
                                    <MicIcon className="h-4 w-4" />
                                </Button>
                            )}

                            <Button
                                size="sm"
                                onClick={handleSubmit}
                                disabled={isPending || (!questionText.trim() && uploadedFiles.length === 0)}
                                className="h-8 w-8 p-0 rounded-lg btn-gradient"
                            >
                                <ArrowUpIcon className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

export default AskAIButton