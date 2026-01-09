"use client"

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CardContent, CardFooter } from "./ui/card";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { useTransition } from "react";
import { Button } from "./ui/button";
import { Loader2, Mail, Lock, ArrowRight } from "lucide-react";
import Link from "next/link";

import { loginAction, signUpAction } from "@/action/users";

type Props = {
  type: "Login" | "SignUp";
};

function AuthForm({ type }: Props) {
  const isLoginForm = type === "Login";
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (formData: FormData) => {
    startTransition(async () => {
      const email = formData.get("email") as string;
      const password = formData.get("password") as string;

      let errorMessage;
      let title;
      let description;

      if (isLoginForm) {
        errorMessage = (await loginAction(email, password)).errorMessage;
        title = "Welcome Back! 🎉";
        description = "You have been successfully logged in";
      } else {
        errorMessage = (await signUpAction(email, password)).errorMessage;
        title = "Account Created! ✨";
        description = "Check your email for a verification link";
      }

      if (!errorMessage) {
        toast.success(title, { description });
        router.replace("/");
      } else {
        toast.error("Oops! Something went wrong", { description: errorMessage });
      }
    });
  };

  return (
    <form action={handleSubmit}>
      <CardContent className="grid w-full items-center gap-5 px-6">
        {/* Email field */}
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium">
            Email Address
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="email"
              name="email"
              placeholder="you@example.com"
              type="email"
              required
              disabled={isPending}
              className="pl-10 h-11 bg-background/50 border-border/50 focus:border-primary focus:bg-background transition-all input-glow"
            />
          </div>
        </div>

        {/* Password field */}
        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm font-medium">
            Password
          </Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="password"
              name="password"
              placeholder="••••••••"
              type="password"
              required
              disabled={isPending}
              className="pl-10 h-11 bg-background/50 border-border/50 focus:border-primary focus:bg-background transition-all input-glow"
            />
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex flex-col gap-5 px-6 pb-6">
        {/* Submit button */}
        <Button
          type="submit"
          disabled={isPending}
          className="w-full h-11 btn-gradient font-semibold gap-2"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              {isLoginForm ? "Sign In" : "Create Account"}
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>

        {/* Divider */}
        <div className="relative w-full">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border/50" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">or</span>
          </div>
        </div>

        {/* Switch form link */}
        <p className="text-sm text-center text-muted-foreground">
          {isLoginForm ? "Don't have an account?" : "Already have an account?"}{" "}
          <Link
            href={isLoginForm ? "/sign-up" : "/login"}
            className={`font-medium gradient-text hover:opacity-80 transition-opacity ${isPending ? "pointer-events-none opacity-50" : ""}`}
          >
            {isLoginForm ? "Sign up for free" : "Sign in instead"}
          </Link>
        </p>
      </CardFooter>
    </form>
  );
}

export default AuthForm;
