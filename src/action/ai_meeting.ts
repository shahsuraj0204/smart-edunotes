"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";
import { getUser } from "@/auth/server";

const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

async function callCerebras(prompt: string) {
  const apiKey = process.env.CEREBRAS_API_KEY;
  if (!apiKey) throw new Error("Cerebras API key not found");

  const response = await fetch("https://api.cerebras.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b",
      messages: [
        {
          role: "system",
          content: "You are a professional AI interviewer. Be concise, direct, and helpful.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error("Cerebras API error:", errorBody);
    throw new Error(`Cerebras API failed: ${response.statusText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

export async function startMeetingAction(documentText: string) {
  await getUser(); // auth check

  const prompt = `
You are a highly professional AI Interviewer.
Your task is to conduct a technical/professional interview based ONLY on the provided document.

FATAL ERRORS TO AVOID:
1. DO NOT ask generic questions like "What are your strengths?" or "Tell me about yourself" unless specifically mentioned in the document.
2. DO NOT ask about experiences, skills, or projects NOT found in the document.
3. Your question MUST be derived directly from a specific detail in the text below.

DOCUMENT CONTENT:
${documentText}

TASK:
Identify ONE specific achievement, skill, or project from the document and ask an insightful, open-ended interview question about it. Be direct and concise.

Ask the FIRST interview question:
`;

  try {
    return await callCerebras(prompt);
  } catch (error) {
    console.warn("Cerebras failed, falling back to Gemini:", error);
    const model = ai.getGenerativeModel({ model: "gemini-3-flash" });
    const result = await model.generateContent(prompt);
    return result.response.text();
  }
}

export async function nextQuestionAction(
  documentText: string,
  questions: string[],
  answers: string[]
) {
  await getUser();

  const prompt = `
You are continuing a professional AI Interview based STRICTLY on the provided document.

DOCUMENT CONTENT:
${documentText}

PREVIOUS INTERVIEW FLOW:
${questions.map((q, i) => `Q: ${q}\nA: ${answers[i]}`).join("\n")}

CRITICAL RULES:
- Ask exactly ONE follow-up question.
- The question MUST focus on a DIFFERENT part of the document than previous questions, or dig significantly deeper into a specific technical detail mentioned.
- ABSOLUTELY NO generic "What else?" or "Tell me more" questions.
- If the document is short, ask about the implications or specific applications of a mentioned skill.

Ask the NEXT analytical interview question:
`;

  try {
    return await callCerebras(prompt);
  } catch (error) {
    console.warn("Cerebras failed, falling back to Gemini:", error);
    const model = ai.getGenerativeModel({ model: "gemini-3-flash" });
    const result = await model.generateContent(prompt);
    return result.response.text();
  }
}
