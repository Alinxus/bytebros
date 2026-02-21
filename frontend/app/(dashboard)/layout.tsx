"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from '@/components/dashboard/Sidebar';
import DashboardHeader from '@/components/dashboard/DashboardHeader';

const DashboardLayout = ({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) => {
    // const router = useRouter();
    // const [isAuthed, setIsAuthed] = useState(false);

    // useEffect(() => {
    //     const token = localStorage.getItem("cavista_token");
    //     if (!token) {
    //         router.push("/login");
    //         return;
    //     }
    //     setIsAuthed(true);
    // }, [router]);

    // if (!isAuthed) {
    //     return (
    //         <div className="min-h-screen bg-background flex items-center justify-center">
    //             <p className="text-sm text-muted">Loading...</p>
    //         </div>
    //     );
    // }

    return (
        <div className="flex min-h-screen bg-background">
            <Sidebar />
            <div className="flex-1 flex flex-col">
                <DashboardHeader />
                <main className="flex-1 px-6 py-6">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;
