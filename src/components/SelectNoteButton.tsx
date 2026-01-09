"use client"

import useNote from "@/hooks/useNote";
import { Note } from "@prisma/client";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { SidebarMenuButton } from "./ui/sidebar";
import Link from "next/link";
import { FileText, Calendar } from "lucide-react";

type Props = {
    note: Note;
}

function SelectNoteButton({ note }: Props) {
    const noteId = useSearchParams().get("noteId") || "";

    const { noteText: selectedNoteText } = useNote();
    const [shouldBeGlobalNoteText, setShouldBeGlobalNoteText] = useState(false);
    const [localNoteText, setLocalNoteText] = useState(note.text);

    const isActive = noteId === note.id;

    useEffect(() => {
        if (noteId === note.id) {
            setShouldBeGlobalNoteText(true);
        } else {
            setShouldBeGlobalNoteText(false);
        }
    }, [noteId, note.id]);

    useEffect(() => {
        if (shouldBeGlobalNoteText) {
            setLocalNoteText(selectedNoteText);
        }
    }, [selectedNoteText, shouldBeGlobalNoteText]);

    const blankNoteText = "Empty note";
    let noteText = localNoteText || blankNoteText;

    if (shouldBeGlobalNoteText) {
        noteText = selectedNoteText || blankNoteText;
    }

    return (
        <SidebarMenuButton
            asChild
            className={`
                group relative items-start gap-3 pr-4 py-3 rounded-xl
                transition-all duration-300 ease-out
                hover:bg-accent/60 hover:translate-x-1
                ${isActive
                    ? "bg-gradient-to-r from-primary/10 to-accent/30 border-l-2 border-primary shadow-sm"
                    : "hover:shadow-sm"
                }
            `}
        >
            <Link href={`/?noteId=${note.id}`} className="flex items-start gap-3 w-full">
                {/* Note icon */}
                <div className={`
                    mt-0.5 p-1.5 rounded-lg transition-all duration-300
                    ${isActive
                        ? "bg-primary/20 text-primary"
                        : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                    }
                `}>
                    <FileText className="h-3.5 w-3.5" />
                </div>

                {/* Note content */}
                <div className="flex flex-col flex-1 min-w-0">
                    <p className={`
                        text-sm font-medium truncate transition-colors
                        ${isActive ? "text-foreground" : "text-foreground/80 group-hover:text-foreground"}
                        ${!localNoteText && !selectedNoteText ? "italic text-muted-foreground" : ""}
                    `}>
                        {noteText}
                    </p>

                    <div className="flex items-center gap-1.5 mt-1">
                        <Calendar className="h-3 w-3 text-muted-foreground/60" />
                        <p className="text-xs text-muted-foreground/60">
                            {new Date(note.updatedAt).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                            })}
                        </p>
                    </div>
                </div>

                {/* Active indicator dot */}
                {isActive && (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2">
                        <div className="w-2 h-2 rounded-full gradient-bg animate-pulse" />
                    </div>
                )}
            </Link>
        </SidebarMenuButton>
    );
}

export default SelectNoteButton;
