"use client";

import { useSearchParams } from "next/navigation";
import { Textarea } from "./ui/textarea";
import { ChangeEvent } from "react";
import { useEffect } from "react";
import useNote from "@/hooks/useNote";
import { updateNoteAction } from "@/action/notes";
import { PenLine } from "lucide-react";

type Props = {
    noteId: string;
    startingNoteText: string;
};

let updateTimeout: NodeJS.Timeout;

function NoteTextInput({ noteId, startingNoteText }: Props) {
    const noteIdParam = useSearchParams().get("noteId") || "";
    const { noteText, setNoteText } = useNote();

    useEffect(() => {
        if (noteIdParam === noteId) {
            setNoteText(startingNoteText);
        }
    }, [startingNoteText, noteIdParam, noteId, setNoteText]);

    const handleUpdateNote = (e: ChangeEvent<HTMLTextAreaElement>) => {
        const text = e.target.value;

        setNoteText(text);

        clearTimeout(updateTimeout);
        updateTimeout = setTimeout(() => {
            updateNoteAction(noteId, text);
        }, 1500);
    };

    return (
        <div className="relative w-full max-w-4xl flex-1">
            {/* Glass card wrapper */}
            <div className="glass-effect rounded-2xl p-1 h-full shadow-lg hover:shadow-xl transition-shadow duration-300">
                {/* Inner container with subtle border */}
                <div className="relative h-full rounded-xl bg-card/50 overflow-hidden">
                    {/* Header bar */}
                    <div className="flex items-center gap-2 px-4 py-3 border-b border-border/30 bg-muted/30">
                        <div className="p-1.5 rounded-lg bg-primary/10">
                            <PenLine className="h-4 w-4 text-primary" />
                        </div>
                        <span className="text-sm font-medium text-muted-foreground">
                            {noteId ? "Editing Note" : "Create a Note"}
                        </span>
                        {noteId && (
                            <div className="ml-auto flex items-center gap-1.5">
                                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                <span className="text-xs text-muted-foreground">Auto-saving</span>
                            </div>
                        )}
                    </div>

                    {/* Textarea */}
                    <Textarea
                        value={noteText}
                        onChange={handleUpdateNote}
                        placeholder="Start typing your notes here... ✨

💡 Tips:
• Use the AI assistant to get help with your notes
• Your notes are automatically saved as you type
• Create new notes using the button above"
                        className="custom-scrollbar h-[calc(100%-52px)] min-h-[400px] resize-none border-0 bg-transparent p-6 text-base leading-relaxed placeholder:text-muted-foreground/50 focus-visible:ring-0 focus-visible:ring-offset-0"
                    />

                    {/* Decorative gradient line at bottom */}
                    <div className="absolute bottom-0 left-0 right-0 h-[2px] gradient-bg opacity-30" />
                </div>
            </div>
        </div>
    );
}

export default NoteTextInput;
