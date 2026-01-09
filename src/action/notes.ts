"use server";

import { getUser } from "@/auth/server";
import prisma from "@/db/prisma";
import { handleError } from "@/lib/utils";
import { GoogleGenerativeAI } from "@google/generative-ai";

/* ----------------------------------
   Gemini helpers
----------------------------------- */

function buildGeminiHistory(
  systemPrompt: string,
  questions: string[],
  responses: string[]
) {
  const history: any[] = [
    {
      role: "user",
      parts: [{ text: systemPrompt }],
    },
  ];

  for (let i = 0; i < questions.length; i++) {
    history.push({
      role: "user",
      parts: [{ text: questions[i] }],
    });

    if (responses[i]) {
      history.push({
        role: "model",
        parts: [{ text: responses[i] }],
      });
    }
  }

  return history;
}

/* ----------------------------------
   File extraction helper
----------------------------------- */

type UploadedFile = {
  name: string;
  type: string;
  content: string; // base64
};

function extractFileText(files?: UploadedFile[]) {
  if (!files || files.length === 0) return "";

  return files
    .map((file) => {
      // Only text-based parsing for now
      if (
        file.type.startsWith("text/") ||
        file.name.endsWith(".txt")
      ) {
        const base64 = file.content.split(",")[1];
        const decoded = Buffer.from(base64, "base64").toString("utf-8");

        return `
File: ${file.name}
Content:
${decoded}
        `.trim();
      }

      return `
File: ${file.name}
Type: ${file.type}
(Note: Binary file – text extraction not enabled)
      `.trim();
    })
    .join("\n\n");
}

/* ----------------------------------
   Notes CRUD
----------------------------------- */

export const createNoteAction = async (noteId: string) => {
  try {
    const user = await getUser();
    if (!user) throw new Error("You must be logged in");

    await prisma.note.create({
      data: {
        id: noteId,
        authorId: user.id,
        text: "",
      },
    });

    return { errorMessage: null };
  } catch (error) {
    return handleError(error);
  }
};

export const updateNoteAction = async (noteId: string, text: string) => {
  try {
    const user = await getUser();
    if (!user) throw new Error("You must be logged in");

    await prisma.note.update({
      where: { id: noteId },
      data: { text },
    });

    return { errorMessage: null };
  } catch (error) {
    return handleError(error);
  }
};

export const deleteNoteAction = async (noteId: string) => {
  try {
    const user = await getUser();
    if (!user) throw new Error("You must be logged in");

    await prisma.note.delete({
      where: {
        id: noteId,
        authorId: user.id,
      },
    });

    return { errorMessage: null };
  } catch (error) {
    return handleError(error);
  }
};

/* ----------------------------------
   Ask AI (Notes + Uploaded Files)
----------------------------------- */

const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export const AskAIAboutNotesActiono = async (
  newQuestions: string[],
  responses: string[],
  uploadedFiles?: UploadedFile[]
) => {
  try {
    const user = await getUser();
    if (!user) throw new Error("You must be logged in");

    const notes = await prisma.note.findMany({
      where: { authorId: user.id },
      orderBy: { createdAt: "desc" },
      select: {
        text: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (notes.length === 0 && (!uploadedFiles || uploadedFiles.length === 0)) {
      return "You have no notes or uploaded files yet.";
    }

    const formattedNotes = notes
      .map(
        (note) => `
Text: ${note.text}
Created At: ${note.createdAt}
Updated At: ${note.updatedAt}
      `.trim()
      )
      .join("\n\n");

    const uploadedFileText = extractFileText(uploadedFiles);

    const systemPrompt = `
You are a helpful AI assistant.

Rules:
- Answer using ONLY the user's notes and uploaded files
- Be concise and clear
- Output VALID, CLEAN HTML only
- No markdown
- No inline styles
- Use <p>, <ul>, <ol>, <li>, <strong>, <em>, <h1>-<h6>, <br>

User Notes:
${formattedNotes || "No notes available"}

Uploaded Files:
${uploadedFileText || "No uploaded files"}
    `.trim();

    // Check if we should use Cerebras (preferred for speed)
    // We use Gemini if:
    // 1. Cerebras key is missing
    // 2. There are many files (Gemini handles large context better/cheaper)
    // 3. Or if Cerebras simply fails
    const useCerebras = !!process.env.CEREBRAS_API_KEY && (!uploadedFiles || uploadedFiles.length < 5);

    if (useCerebras) {
      try {
        const messages = [
          { role: "system", content: systemPrompt },
          ...newQuestions.slice(0, -1).map((q, i) => ([
            { role: "user", content: q },
            { role: "assistant", content: responses[i] || "" }
          ])).flat(),
          { role: "user", content: newQuestions[newQuestions.length - 1] }
        ].filter(m => m.content !== "");

        const cerebrasResponse = await fetch("https://api.cerebras.ai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.CEREBRAS_API_KEY}`,
          },
          body: JSON.stringify({
            model: "llama-3.3-70b",
            messages,
            temperature: 0.7,
            max_tokens: 1000,
          }),
        });

        if (cerebrasResponse.ok) {
          const data = await cerebrasResponse.json();
          return data.choices[0].message.content;
        }
        console.warn("Cerebras chat failed, falling back to Gemini");
      } catch (err) {
        console.warn("Cerebras chat error, falling back to Gemini:", err);
      }
    }

    const model = ai.getGenerativeModel({
      model: "gemini-3-flash",
    });

    const history = buildGeminiHistory(
      systemPrompt,
      newQuestions,
      responses
    );

    const chat = model.startChat({ history });

    const result = await chat.sendMessage(
      newQuestions[newQuestions.length - 1]
    );

    return result.response.text() || "AI failed to generate a response.";
  } catch (error) {
    return handleError(error);
  }
};
