"use client";
/*
|-------------------------------------------------------------
| Npm Import
|-------------------------------------------------------------
*/
import { useRouter } from "next/navigation";

/*
|-------------------------------------------------------------
| Dashboard Header Component
|-------------------------------------------------------------
*/
function DashboardHeader() {
    const router = useRouter();

/*
|-------------------------------------------------------------
| Handlers
|-------------------------------------------------------------
| hndleLogout: Clears auth token and redirects to login page.
| handleKeyDown: Allows logout via Enter or Space key for accessibility.
|-------------------------------------------------------------
*/
    const handleLogout = () => {
        localStorage.removeItem("cavista_token");
        router.push("/login");
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleLogout();
        }
    };
/*
|-------------------------------------------------------------
| Render
|-------------------------------------------------------------
*/
    return (
        <header className="sticky top-0 z-40 bg-background border-b border-border">
            <div className="flex items-center justify-between px-6 py-4">
                <div>
                    <p className="text-xs font-medium tracking-widest uppercase text-muted">
                        BETA 
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    <span
                        className="text-sm text-muted hover:text-foreground transition-colors cursor-pointer"
                        onClick={handleLogout}
                        onKeyDown={handleKeyDown}
                        tabIndex={0}
                        role="button"
                    >
                        Log Out
                    </span>
                </div>
            </div>
        </header>
    );
};

export default DashboardHeader;
