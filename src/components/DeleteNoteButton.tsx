"use client"

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "./ui/button";
import { Loader2, Trash2, AlertTriangle } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useTransition } from "react";
import { deleteNoteAction } from "@/action/notes";

type Props = {
    noteId: string;
    deleteNoteLocally: (noteId: string) => void;
};

function DeleteNoteButton({ noteId, deleteNoteLocally }: Props) {
    const router = useRouter();
    const noteIdParams = useSearchParams().get("noteId") || "";

    const [isPending, startTransition] = useTransition();

    const handleDeleteNote = () => {
        startTransition(async () => {
            const { errorMessage } = await deleteNoteAction(noteId);

            if (!errorMessage) {
                toast.success("Note Deleted 🗑️", {
                    description: "Your note has been permanently removed"
                });
                deleteNoteLocally(noteId);

                if (noteId === noteIdParams) {
                    router.replace("/");
                }
            } else {
                toast.error("Deletion Failed", { description: errorMessage });
            }
        });
    };

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button
                    className="absolute right-2 top-1/2 -translate-y-1/2 size-7 p-0 opacity-0 group-hover/item:opacity-100 transition-opacity hover:bg-destructive/10 hover:text-destructive [&_svg]:size-3.5"
                    variant="ghost"
                >
                    <Trash2 />
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="glass-effect border-border/30 max-w-md">
                <AlertDialogHeader className="space-y-4">
                    {/* Warning icon */}
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                        <AlertTriangle className="h-6 w-6 text-destructive" />
                    </div>

                    <AlertDialogTitle className="text-center text-xl">
                        Delete this note?
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-center">
                        This action cannot be undone. Your note will be permanently removed from your account.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="gap-2 sm:gap-0">
                    <AlertDialogCancel className="hover-lift">
                        Keep Note
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleDeleteNote}
                        className="bg-destructive text-white hover:bg-destructive/90 gap-2 min-w-[100px]"
                    >
                        {isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <>
                                <Trash2 className="h-4 w-4" />
                                Delete
                            </>
                        )}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

export default DeleteNoteButton;
