import { createServerClient } from "@supabase/ssr";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    // Validate environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error("Missing Supabase environment variables");
      return NextResponse.json({ error: "Configuration error" }, { status: 500 });
    }

    const cookieHeader = req.headers.get("cookie") ?? "";
    let nodeResponse = NextResponse.next();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            const cookies: { name: string; value: string }[] = [];
            if (!cookieHeader) return cookies;
            const pairs = cookieHeader.split(";").map((c) => c.trim());
            for (const p of pairs) {
              const eq = p.indexOf("=");
              if (eq > -1) {
                cookies.push({ name: p.slice(0, eq), value: decodeURIComponent(p.slice(eq + 1)) });
              }
            }
            return cookies;
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              nodeResponse.cookies.set(name, value, options);
            });
          },
        },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
    }

    const newest = await prisma.note.findFirst({
      where: { authorId: user.id },
      orderBy: { createdAt: "desc" },
      select: { id: true },
    });

    if (newest?.id) {
      return NextResponse.json({ noteId: newest.id });
    }

    const created = await prisma.note.create({
      data: {
        authorId: user.id,
        text: "",
      },
    });

    return NextResponse.json({ noteId: created.id });
  } catch (err: any) {
    console.error("ensure-note error:", err?.message ?? err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}