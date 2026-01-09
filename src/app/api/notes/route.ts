import { getUser } from "@/auth/server";
import prisma from "@/db/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    try {
        const user = await getUser();

        if (!user) {
            return NextResponse.json([], { status: 200 });
        }

        const notes = await prisma.note.findMany({
            where: { authorId: user.id },
            orderBy: { updatedAt: "desc" },
        });

        return NextResponse.json(notes);
    } catch (error) {
        console.error("Error fetching notes:", error);
        return NextResponse.json([], { status: 500 });
    }
}
