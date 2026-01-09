// src/middleware.ts
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  try {
    return await updateSession(request);
  } catch (err: any) {
    console.error("MIDDLEWARE top-level error:", err?.message ?? err, err?.stack ?? "");
    return new NextResponse("Server error (middleware)", { status: 500 });
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

export async function updateSession(request: NextRequest) {
  // base response
  const response = NextResponse.next({ request });

  try {
    const pathname = request.nextUrl.pathname;
    const searchParams = request.nextUrl.searchParams;

    const isAuthRoute = pathname === "/login" || pathname === "/sign-up";

    // Lightweight cookie check — do NOT validate token here.
    // We only check whether likely auth cookies exist so we can avoid
    // unnecessary server calls for anonymous visitors.
    const cookieHeader = request.headers.get("cookie") ?? "";
    const hasAuthCookie =
      cookieHeader.includes("sb-access-token") ||
      cookieHeader.includes("sb-refresh-token") ||
      cookieHeader.includes("supabase-auth-token") ||
      cookieHeader.includes("sb:");

    // If user opens login/signup but already has auth cookie -> redirect to /
    if (isAuthRoute && hasAuthCookie) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    // If at root (/) and no noteId, ask server to ensure/return a noteId
    if (pathname === "/" && !searchParams.get("noteId")) {
      const apiUrl = new URL("/api/ensure-note", request.url).toString();

      const apiRes = await fetch(apiUrl, {
        method: "GET",
        headers: {
          cookie: cookieHeader, // forward cookies so server can authenticate
        },
        redirect: "manual",
      });

      if (!apiRes.ok) {
        // server returned 4xx/5xx or user not authenticated — just continue
        console.error("ensure-note API failed:", apiRes.status, await apiRes.text().catch(() => ""));
        return response;
      }

      const data = await apiRes.json().catch((e) => {
        console.error("invalid JSON from ensure-note:", e);
        return null;
      });

      if (data && data.noteId) {
        const url = request.nextUrl.clone();
        url.searchParams.set("noteId", data.noteId);
        return NextResponse.redirect(url);
      }
    }

    return response;
  } catch (err: any) {
    console.error("updateSession error:", err?.message ?? err, err?.stack ?? "");
    return new NextResponse("Middleware error", { status: 500 });
  }
}
