import {
  Card,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import AuthForm from "@/components/AuthForm";
import { UserPlus, Sparkles } from "lucide-react";

function SignUpPage() {
  return (
    <div className="relative mt-10 flex flex-1 flex-col items-center justify-center px-4">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-80 h-80 rounded-full bg-gradient-to-br from-[var(--gradient-end)]/20 to-transparent blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-80 h-80 rounded-full bg-gradient-to-tr from-primary/20 to-transparent blur-3xl" />
      </div>

      {/* Card with glass effect */}
      <Card className="relative w-full max-w-md glass-effect border-border/30 shadow-2xl card-hover">
        {/* Gradient border accent */}
        <div className="absolute inset-0 rounded-xl gradient-border opacity-50" />

        <CardHeader className="space-y-4 pb-2">
          {/* Icon */}
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl gradient-bg shadow-lg animate-float">
            <UserPlus className="h-7 w-7 text-white" />
          </div>

          {/* Title */}
          <div className="space-y-2 text-center">
            <CardTitle className="text-3xl font-bold tracking-tight">
              Create Account
            </CardTitle>
            <p className="text-muted-foreground">
              Start your learning journey today
            </p>
          </div>
        </CardHeader>

        <AuthForm type="SignUp" />

        {/* Decorative sparkles */}
        <div className="absolute -top-2 -right-2">
          <Sparkles className="h-6 w-6 text-primary/40 animate-pulse" />
        </div>
        <div className="absolute -bottom-2 -left-2">
          <Sparkles className="h-4 w-4 text-[var(--gradient-end)]/40 animate-pulse" style={{ animationDelay: '0.5s' }} />
        </div>
      </Card>

      {/* Footer text */}
      <p className="mt-8 text-center text-sm text-muted-foreground">
        Join thousands learning with{" "}
        <span className="font-medium gradient-text">Smart Edu-Notes</span>
      </p>
    </div>
  );
}

export default SignUpPage;
