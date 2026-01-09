"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "./ui/button";
import DarkModeToggle from "./DarkModeToggle";
import LogOutButton from "./LogOutButton";
import { getUserAction } from "@/auth/actions";
import { SidebarTrigger } from "./ui/sidebar";
import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";

export default function Header() {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const currentUser = await getUserAction();
                setUser(currentUser);
            } catch (error) {
                console.error("Error fetching user:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, []);

    if (loading) {
        return (
            <header className="glass-effect relative flex h-20 w-full items-center justify-between px-3 sm:px-8 border-b border-border/50">
                <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full skeleton-pulse" />
                    <div className="h-6 w-32 rounded skeleton-pulse" />
                </div>
                <div className="flex gap-3">
                    <div className="h-9 w-20 rounded-md skeleton-pulse" />
                    <div className="h-9 w-9 rounded-md skeleton-pulse" />
                </div>
            </header>
        );
    }

    return (
        <header className="glass-effect sticky top-0 z-50 flex h-20 w-full items-center justify-between px-3 sm:px-8 border-b border-border/30">
            {/* Gradient accent line at bottom */}
            <div className="absolute bottom-0 left-0 right-0 h-[2px] gradient-bg opacity-60" />

            <SidebarTrigger className="absolute left-2 top-2 hover:bg-accent/80 transition-colors" />

            <Link
                className="flex items-center gap-3 group ml-8 sm:ml-0"
                href="/"
            >
                {/* Logo with hover effect */}
                <div className="relative">
                    <div className="absolute inset-0 rounded-full gradient-bg opacity-0 group-hover:opacity-30 blur-xl transition-opacity duration-500" />
                    <Image
                        src="/logo.png"
                        height={48}
                        width={48}
                        alt="Smart Edu-Notes Logo"
                        className="rounded-full ring-2 ring-border/50 group-hover:ring-primary/50 transition-all duration-300 group-hover:scale-105"
                        priority
                    />
                </div>

                {/* Brand name with gradient */}
                <div className="flex flex-col">
                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                        <span className="gradient-text">SMART</span>
                        <span className="text-foreground"> EDU-NOTES</span>
                    </h1>
                    <span className="text-xs text-muted-foreground hidden sm:block">
                        AI-Powered Learning
                    </span>
                </div>
            </Link>

            <div className="flex items-center gap-3">
                {user ? (
                    <LogOutButton />
                ) : (
                    <>
                        <Button
                            asChild
                            className="btn-gradient hidden sm:flex gap-2 font-semibold"
                        >
                            <Link href="/sign-up">
                                <Sparkles className="h-4 w-4" />
                                SIGN UP
                            </Link>
                        </Button>
                        <Button
                            asChild
                            variant="outline"
                            className="hover-lift font-medium"
                        >
                            <Link href="/login">LOGIN</Link>
                        </Button>
                    </>
                )}

                <DarkModeToggle />
            </div>
        </header>
    );
}