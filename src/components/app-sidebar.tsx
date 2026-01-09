"use client";

import { getUserAction } from "@/auth/actions";
import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupLabel } from "@/components/ui/sidebar";
import SidebarGroupContent from "./SidebarGroupContent";
import { BookOpen, LogIn, RefreshCw } from "lucide-react";
import { Button } from "./ui/button";

export default function AppSidebar() {
  const [user, setUser] = useState<any>(null);
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const fetchNotes = useCallback(async () => {
    try {
      const currentUser = await getUserAction();
      setUser(currentUser);

      if (currentUser) {
        const response = await fetch(`/api/notes?userId=${currentUser.id}`, {
          cache: 'no-store'
        });
        const userNotes = await response.json();
        setNotes(userNotes);
      }
    } catch (error) {
      console.error("Error fetching notes:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch on mount and when pathname/searchParams change (e.g., after creating a new note)
  useEffect(() => {
    fetchNotes();
  }, [pathname, searchParams, fetchNotes]);

  const handleRefresh = () => {
    setLoading(true);
    fetchNotes();
  };

  return (
    <Sidebar className="border-r border-border/30 bg-gradient-to-b from-sidebar via-sidebar to-accent/20">
      <SidebarContent className="custom-scrollbar">
        <SidebarGroup>
          {/* Header section */}
          <SidebarGroupLabel className="mb-4 mt-4 px-3">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg gradient-bg">
                  <BookOpen className="h-4 w-4 text-white" />
                </div>
                <span className="text-lg font-semibold gradient-text">
                  {user ? "Your Notes" : "Notes"}
                </span>
              </div>
              {user && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRefresh}
                  className="h-7 w-7 p-0 hover:bg-primary/10"
                  disabled={loading}
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                </Button>
              )}
            </div>
          </SidebarGroupLabel>

          {/* Loading state */}
          {loading && (
            <div className="px-3 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-2 animate-pulse">
                  <div className="h-10 rounded-lg skeleton-pulse" />
                </div>
              ))}
            </div>
          )}

          {/* Not logged in state */}
          {!loading && !user && (
            <div className="px-3 py-6">
              <div className="glass-effect rounded-xl p-4 text-center space-y-3">
                <div className="mx-auto w-12 h-12 rounded-full gradient-bg flex items-center justify-center">
                  <LogIn className="h-6 w-6 text-white" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Sign in to access your notes
                </p>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 text-sm font-medium gradient-text hover:opacity-80 transition-opacity"
                >
                  Login to get started →
                </Link>
              </div>
            </div>
          )}

          {/* Notes list */}
          {!loading && user && <SidebarGroupContent notes={notes} />}

          {/* Empty state */}
          {!loading && user && notes.length === 0 && (
            <div className="px-3 py-6">
              <div className="glass-effect rounded-xl p-4 text-center space-y-2">
                <p className="text-sm text-muted-foreground">
                  No notes yet
                </p>
                <p className="text-xs text-muted-foreground/70">
                  Click "New Note" to create your first note
                </p>
              </div>
            </div>
          )}
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}