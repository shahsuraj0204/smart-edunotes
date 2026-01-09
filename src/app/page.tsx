import { getUser } from "@/auth/server";
import prisma from "@/db/prisma";
import AskAIButton from "@/components/AskAIButton";
import NewNoteButton from "@/components/NewNoteButton";
import AIMeetingButton from "@/components/AIMeetingButton";
import NoteTextInput from "@/components/NoteTextInput";
import { BookOpen, Sparkles } from "lucide-react";
import { Suspense } from "react";

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

async function HomePage({ searchParams }: Props) {
  const noteIdParam = (await searchParams).noteId;
  const user = await getUser();

  const noteId = Array.isArray(noteIdParam) ? noteIdParam![0] : noteIdParam || "";

  const note = (noteId && user?.id)
    ? await prisma.note.findFirst({
      where: { id: noteId, authorId: user.id },
    })
    : null;

  return (
    <div className="relative flex h-full flex-col items-center gap-6 py-4">
      {/* Welcome section for new users */}
      {!noteId && !user && (
        <div className="w-full max-w-4xl text-center space-y-4 py-8">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl gradient-bg shadow-lg animate-float">
            <BookOpen className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold">
            Welcome to{" "}
            <span className="gradient-text">Smart Edu-Notes</span>
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Your AI-powered note-taking companion. Sign in to start organizing your thoughts and enhancing your learning.
          </p>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex w-full max-w-4xl justify-end gap-3 flex-wrap">
        <AIMeetingButton user={user} />
        <AskAIButton user={user} />
        <NewNoteButton user={user} />
      </div>

      {/* Note input area */}
      <Suspense fallback={<div className="w-full max-w-4xl h-96 animate-pulse bg-muted/20 rounded-2xl" />}>
        <NoteTextInput noteId={noteId} startingNoteText={note?.text || ""} />
      </Suspense>

      {/* Floating decorative element */}
      <div className="fixed bottom-8 right-8 pointer-events-none opacity-20">
        <Sparkles className="h-12 w-12 text-primary animate-pulse" />
      </div>
    </div>
  );
}

export default HomePage;
