"use client";

import { useState } from "react"
import { Button } from "./ui/button"
import { Loader2, LogOut } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation";
import { logOutAction } from "@/action/users";

function LogOutButton() {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleLogOut = async () => {
        setLoading(true);

        const { errorMessage } = await logOutAction();

        if (!errorMessage) {
            toast.success("See you soon! 👋", {
                description: "You have successfully logged out",
            });
            router.push("/");
        } else {
            toast.error("Logout Failed", {
                description: errorMessage,
            });
        }

        setLoading(false);
    };

    return (
        <Button
            variant="outline"
            onClick={handleLogOut}
            disabled={loading}
            className="gap-2 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50 transition-all"
        >
            {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
                <>
                    <LogOut className="h-4 w-4" />
                    <span className="hidden sm:inline">Log Out</span>
                </>
            )}
        </Button>
    );
}

export default LogOutButton;
