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

import { Fragment, useRef, useState, useTransition, useEffect } from "react";
import { startListening, speak, stopSpeaking, stopListening, isSpeaking } from "@/lib/voiceService";

import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import {
    ArrowUpIcon,
    MicIcon,
    StopCircleIcon,
    Upload,
    Sparkles,
    Volume2,
    VolumeX,
    Bot,
    User as UserIcon,
    Video,
    FileText,
    CheckCircle,
    XCircle,
    RotateCcw,
    Play,
    Pause
} from "lucide-react";
import { startMeetingAction, nextQuestionAction } from "@/action/ai_meeting";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type Props = {
    user: User | null;
}

type InterviewState = 'upload' | 'ready' | 'interviewing' | 'answering' | 'feedback' | 'complete';

function AIMeetingButton({ user }: Props) {
    const router = useRouter();

    const [isPending, startTransition] = useTransition();

    const [open, setOpen] = useState(false);
    const [interviewState, setInterviewState] = useState<InterviewState>('upload');
    const [documentText, setDocumentText] = useState("");
    const [documentName, setDocumentName] = useState("");

    const [questions, setQuestions] = useState<string[]>([]);
    const [answers, setAnswers] = useState<string[]>([]);
    const [currentAnswer, setCurrentAnswer] = useState("");
    const [isListening, setIsListening] = useState(false);
    const [isSpeakingAI, setIsSpeakingAI] = useState(false);
    const [autoSpeak, setAutoSpeak] = useState(true);
    const [questionCount, setQuestionCount] = useState(0);
    const maxQuestions = 5;

    const fileInputRef = useRef<HTMLInputElement>(null);
    const textAreaRef = useRef<HTMLTextAreaElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);

    const handleOnOpenChange = (isOpen: boolean) => {
        if (!user) {
            router.push('/login');
        } else {
            if (isOpen) {
                resetInterview();
            }
            setOpen(isOpen);
        }
    }

    const resetInterview = () => {
        setInterviewState('upload');
        setDocumentText("");
        setDocumentName("");
        setQuestions([]);
        setAnswers([]);
        setCurrentAnswer("");
        setQuestionCount(0);
        stopSpeaking();
        stopListening();
        setIsListening(false);
        setIsSpeakingAI(false);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setDocumentName(file.name);

        // Read file content
        if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
            const text = await file.text();
            setDocumentText(text);
            setInterviewState('ready');
        } else if (file.type === 'application/pdf') {
            // For PDF, we'll send a note that it's a PDF
            setDocumentText(`[PDF Document: ${file.name}] - The user has uploaded a PDF. Since text extraction is in "Easy Mode", please ask the user to paste the actual text if you find this context insufficient, or ask high-level professional/technical interview questions relevant to a developer/student based on the filename.`);
            setInterviewState('ready');
        } else {
            // For other files, try to read as text
            try {
                const text = await file.text();
                setDocumentText(text);
                setInterviewState('ready');
            } catch {
                toast.error("Could not read file. Please use a text file.");
            }
        }

        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const startInterview = () => {
        if (!documentText) {
            toast.error("Please upload a document first");
            return;
        }

        // Stop any active speech/listening
        stopSpeaking();
        stopListening();
        setIsListening(false);
        setIsSpeakingAI(false);

        setInterviewState('interviewing');

        startTransition(async () => {
            try {
                const firstQuestion = await startMeetingAction(documentText);
                setQuestions([firstQuestion]);
                setQuestionCount(1);
                setInterviewState('answering');

                if (autoSpeak) {
                    speakQuestion(firstQuestion);
                }
            } catch (error) {
                console.error("Error starting interview:", error);
                toast.error("Failed to start interview. Please try again.");
                setInterviewState('ready');
            }
        });
    };

    const speakQuestion = (text: string) => {
        setIsSpeakingAI(true);
        speak(text, () => {
            setIsSpeakingAI(false);
            // Auto-start listening after AI finishes speaking
            if (autoSpeak) {
                setTimeout(() => {
                    handleVoiceInput();
                }, 1000);
            }
        });
    };

    const handleVoiceInput = () => {
        setIsListening(true);
        startListening(
            (text: string) => {
                setCurrentAnswer(prev => prev + (prev ? " " : "") + text);
            },
            (error: string) => {
                // Quietly handle no-speech
                if (error !== 'no-speech') {
                    console.error("Voice input error:", error);
                    toast.error(error);
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

    const submitAnswer = () => {
        if (!currentAnswer.trim()) {
            toast.error("Please provide an answer");
            return;
        }

        handleStopListening();

        const newAnswers = [...answers, currentAnswer];
        setAnswers(newAnswers);
        setCurrentAnswer("");

        if (questionCount >= maxQuestions) {
            // Interview complete
            setInterviewState('complete');
            if (autoSpeak) {
                speak("Excellent! The interview is complete. Thank you for your responses. You can review your answers below.");
            }
            return;
        }

        // Get next question
        setInterviewState('interviewing');

        startTransition(async () => {
            try {
                const nextQ = await nextQuestionAction(documentText, questions, newAnswers);
                setQuestions(prev => [...prev, nextQ]);
                setQuestionCount(prev => prev + 1);
                setInterviewState('answering');

                if (autoSpeak) {
                    speakQuestion(nextQ);
                }
            } catch (error) {
                console.error("Error getting next question:", error);
                toast.error("Failed to get next question");
                setInterviewState('complete');
            }
        });
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            submitAnswer();
        }
    };

    const handleInput = () => {
        const textarea = textAreaRef.current;
        if (!textarea) return;
        textarea.style.height = "auto";
        textarea.style.height = `${textarea.scrollHeight}px`;
    };

    const scrollToBottom = () => {
        contentRef.current?.scrollTo({
            top: contentRef.current.scrollHeight,
            behavior: "smooth"
        });
    };

    useEffect(() => {
        scrollToBottom();
    }, [questions, answers]);

    return (
        <Dialog open={open} onOpenChange={handleOnOpenChange}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2 hover-lift font-medium bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/30 hover:border-purple-500/50">
                    <Video className="h-4 w-4 text-purple-500" />
                    AI Interview
                </Button>
            </DialogTrigger>
            <DialogContent className="glass-effect flex h-[85vh] max-w-4xl flex-col overflow-hidden border-border/30">
                {/* Header */}
                <DialogHeader className="border-b border-border/30 pb-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500">
                                <Video className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-semibold flex items-center gap-2">
                                    AI Interview Coach
                                    <span className="text-[10px] bg-green-500/20 text-green-500 px-1.5 py-0.5 rounded-full border border-green-500/30 font-bold uppercase tracking-tighter">Grounded</span>
                                </DialogTitle>
                                <DialogDescription className="text-sm">
                                    Practice interviews based strictly on your content
                                </DialogDescription>
                            </div>
                        </div>

                        {/* Auto-speak toggle */}
                        <Button
                            variant={autoSpeak ? "default" : "outline"}
                            size="sm"
                            onClick={() => setAutoSpeak(!autoSpeak)}
                            className={`gap-2 ${autoSpeak ? 'btn-gradient' : ''}`}
                        >
                            {autoSpeak ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                            Voice Mode
                        </Button>
                    </div>

                    {/* Progress indicator */}
                    {interviewState !== 'upload' && interviewState !== 'ready' && (
                        <div className="mt-4">
                            <div className="flex justify-between text-xs text-muted-foreground mb-1">
                                <span>Question {questionCount} of {maxQuestions}</span>
                                <span>{Math.round((questionCount / maxQuestions) * 100)}%</span>
                            </div>
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
                                    style={{ width: `${(questionCount / maxQuestions) * 100}%` }}
                                />
                            </div>
                        </div>
                    )}
                </DialogHeader>

                {/* Content area */}
                <div ref={contentRef} className="flex-1 overflow-y-auto custom-scrollbar py-4 space-y-4">
                    {/* Upload state */}
                    {interviewState === 'upload' && (
                        <div className="flex flex-col items-center justify-center h-full text-center space-y-6 py-12">
                            <div className="p-6 rounded-3xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 animate-float">
                                <FileText className="h-12 w-12 text-purple-500" />
                            </div>
                            <div className="space-y-2 max-w-md">
                                <h3 className="font-semibold text-xl">Upload or Paste Your Document</h3>
                                <p className="text-sm text-muted-foreground">
                                    Upload your resume, or paste your notes. The AI will act as an interviewer,
                                    asking relevant questions based on the content.
                                </p>
                            </div>

                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".txt,.pdf,.doc,.docx,.md"
                                onChange={handleFileUpload}
                                className="hidden"
                            />

                            <div className="flex flex-col items-center gap-4 w-full max-w-md">
                                <Button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="btn-gradient gap-2 text-lg px-8 py-6 w-full"
                                >
                                    <Upload className="h-5 w-5" />
                                    Upload Document
                                </Button>

                                <div className="flex items-center gap-4 w-full">
                                    <div className="h-[1px] flex-1 bg-border/30" />
                                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">or</span>
                                    <div className="h-[1px] flex-1 bg-border/30" />
                                </div>

                                <Textarea
                                    placeholder="Paste your notes or document text here..."
                                    className="min-h-[120px] bg-background/50 border-border/30 focus-within:border-purple-500/50"
                                    value={documentText}
                                    onChange={(e) => {
                                        setDocumentText(e.target.value);
                                        if (e.target.value.trim().length > 20) {
                                            setDocumentName("Pasted Text");
                                        }
                                    }}
                                />

                                {documentText.trim().length > 10 && (
                                    <Button
                                        onClick={() => setInterviewState('ready')}
                                        variant="outline"
                                        className="w-full border-purple-500/30 hover:bg-purple-500/10"
                                    >
                                        Use This Text →
                                    </Button>
                                )}
                            </div>

                            <p className="text-xs text-muted-foreground">
                                Supports: TXT, PDF, DOC, DOCX, MD
                            </p>
                        </div>
                    )}

                    {/* Ready state */}
                    {interviewState === 'ready' && (
                        <div className="flex flex-col items-center justify-center h-full text-center space-y-6 py-12">
                            <div className="p-4 rounded-2xl bg-green-500/20 animate-pulse">
                                <CheckCircle className="h-10 w-10 text-green-500" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="font-semibold text-xl">Document Uploaded!</h3>
                                <p className="text-sm text-muted-foreground max-w-md">
                                    <span className="font-medium text-foreground">{documentName}</span>
                                    <br />
                                    Ready to start your mock interview. The AI will ask you {maxQuestions} questions
                                    based on your document content.
                                </p>
                            </div>

                            <div className="flex gap-3">
                                <Button
                                    variant="outline"
                                    onClick={resetInterview}
                                    className="gap-2"
                                >
                                    <RotateCcw className="h-4 w-4" />
                                    Change Document
                                </Button>
                                <Button
                                    onClick={startInterview}
                                    className="btn-gradient gap-2 px-8"
                                    disabled={isPending}
                                >
                                    <Play className="h-4 w-4" />
                                    Start Interview
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Interview in progress */}
                    {(interviewState === 'interviewing' || interviewState === 'answering' || interviewState === 'complete') && (
                        <>
                            {questions.map((question, index) => (
                                <Fragment key={index}>
                                    {/* AI Question */}
                                    <div className="flex justify-start">
                                        <div className="flex items-start gap-2 max-w-[80%]">
                                            <div className="p-1.5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 shrink-0 mt-1">
                                                <Bot className="h-3 w-3 text-white" />
                                            </div>
                                            <div className="space-y-2">
                                                <div className="message-bubble ai">
                                                    <span className="text-xs text-muted-foreground block mb-1">
                                                        Question {index + 1}
                                                    </span>
                                                    {question}
                                                </div>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => speakQuestion(question)}
                                                    className="h-7 px-2 text-xs gap-1 hover:bg-purple-500/10"
                                                    disabled={isSpeakingAI}
                                                >
                                                    <Volume2 className="h-3 w-3" />
                                                    Listen
                                                </Button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* User Answer */}
                                    {answers[index] && (
                                        <div className="flex justify-end">
                                            <div className="flex items-start gap-2 max-w-[80%]">
                                                <div className="message-bubble user">
                                                    {answers[index]}
                                                </div>
                                                <div className="p-1.5 rounded-full bg-primary/20 shrink-0 mt-1">
                                                    <UserIcon className="h-3 w-3 text-primary" />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </Fragment>
                            ))}

                            {/* Thinking indicator */}
                            {isPending && interviewState === 'interviewing' && (
                                <div className="flex justify-start">
                                    <div className="flex items-center gap-2">
                                        <div className="p-1.5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 shrink-0">
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

                            {/* Speaking indicator */}
                            {isSpeakingAI && (
                                <div className="flex items-center justify-center gap-2 py-2">
                                    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/20 animate-pulse">
                                        <Volume2 className="h-4 w-4 text-purple-500" />
                                        <span className="text-sm text-purple-500">AI is speaking...</span>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => {
                                                stopSpeaking();
                                                setIsSpeakingAI(false);
                                            }}
                                            className="h-6 px-2"
                                        >
                                            <VolumeX className="h-3 w-3" />
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* Interview complete */}
                            {interviewState === 'complete' && (
                                <div className="flex flex-col items-center justify-center text-center space-y-4 py-8 border-t border-border/30 mt-4">
                                    <div className="p-4 rounded-2xl bg-green-500/20">
                                        <CheckCircle className="h-10 w-10 text-green-500" />
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="font-semibold text-xl">Interview Complete!</h3>
                                        <p className="text-sm text-muted-foreground max-w-md">
                                            Great job! You answered all {maxQuestions} questions.
                                            Review your responses above to see how you performed.
                                        </p>
                                    </div>
                                    <Button
                                        onClick={resetInterview}
                                        className="btn-gradient gap-2"
                                    >
                                        <RotateCcw className="h-4 w-4" />
                                        Start New Interview
                                    </Button>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Input area - only show when answering */}
                {interviewState === 'answering' && (
                    <div className="mt-auto border-t border-border/30 pt-4">
                        {/* Listening indicator */}
                        {isListening && (
                            <div className="mb-3 flex items-center justify-center gap-2">
                                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/20 animate-pulse">
                                    <MicIcon className="h-4 w-4 text-red-500" />
                                    <span className="text-sm text-red-500">Listening...</span>
                                </div>
                            </div>
                        )}

                        {/* Input box */}
                        <div className="flex items-end gap-2 rounded-xl border border-border/50 bg-background/50 p-3 focus-within:border-purple-500/50 focus-within:ring-2 focus-within:ring-purple-500/20 transition-all">
                            <Textarea
                                ref={textAreaRef}
                                placeholder="Type or speak your answer..."
                                className="flex-1 resize-none border-0 bg-transparent p-0 text-sm shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                                style={{
                                    minHeight: "0",
                                    lineHeight: "1.5",
                                }}
                                rows={1}
                                onInput={handleInput}
                                onKeyDown={handleKeyDown}
                                value={currentAnswer}
                                onChange={(e) => setCurrentAnswer(e.target.value)}
                            />

                            <div className="flex gap-1.5 shrink-0">
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
                                        disabled={isListening || isSpeakingAI}
                                        className="h-8 w-8 p-0 hover:bg-purple-500/20"
                                    >
                                        <MicIcon className="h-4 w-4" />
                                    </Button>
                                )}

                                <Button
                                    size="sm"
                                    onClick={submitAnswer}
                                    disabled={isPending || !currentAnswer.trim()}
                                    className="h-8 w-8 p-0 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90"
                                >
                                    <ArrowUpIcon className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        <p className="text-xs text-muted-foreground text-center mt-2">
                            Press Enter to submit • Voice mode auto-starts when AI finishes speaking
                        </p>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}

export default AIMeetingButton
