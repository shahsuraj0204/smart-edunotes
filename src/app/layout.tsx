import type { Metadata } from "next";
import "@/styles/globals.css";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { Inter } from "next/font/google";

import { Toaster } from "@/components/ui/sonner";
import Header from "@/components/Header";
import { SidebarProvider } from "@/components/ui/sidebar";
import AppSidebar from "@/components/app-sidebar";
import NoteProvider from "@/providers/NoteProvider";

// Premium font - Inter for modern, clean typography
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Smart Edu-Notes | AI-Powered Note Taking",
  description: "Transform your learning with intelligent, AI-powered note-taking. Organize, search, and enhance your study materials effortlessly.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <body suppressHydrationWarning className={`${inter.className} antialiased`}>
        {/* Decorative background orbs */}
        <div className="bg-orbs" aria-hidden="true" />

        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange={false}
        >
          <NoteProvider>
            <SidebarProvider>
              <AppSidebar />

              <div className="flex min-h-screen w-full flex-col">
                <Header />
                <main className="flex flex-1 flex-col px-4 pt-6 xl:px-8">
                  {children}
                </main>
              </div>
            </SidebarProvider>
          </NoteProvider>

          <Toaster
            position="bottom-right"
            toastOptions={{
              classNames: {
                toast: "glass-effect border-border/50",
                title: "font-semibold",
                description: "text-muted-foreground",
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
