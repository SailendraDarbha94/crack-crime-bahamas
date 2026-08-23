"use client"
import app from '@/lib/firebase';
import { getAuth, onAuthStateChanged, signOut, sendPasswordResetEmail } from 'firebase/auth';
import { useToast } from '@/lib/toastContext';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';

const ProfilePage: React.FC = () => {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const { toast } = useToast();

    useEffect(() => {
        const auth = getAuth(app);
        const unsub = onAuthStateChanged(auth, (user) => {
            if (user) {
                setUser(user);
            } else {
                router.push("/login");
            }
        });
        return unsub;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleSignOut = async () => {
        await signOut(getAuth(app));
        router.push("/");
    };

    const handlePasswordReset = async () => {
        if (!user?.email) return;
        try {
            await sendPasswordResetEmail(getAuth(app), user.email);
            toast({ message: `Password reset email sent to ${user.email}`, type: "success" });
        } catch (err) {
            console.error(err);
            toast({ message: "Could not send reset email. Please try again.", type: "error" });
        }
    };

    return (
        <div className="w-full min-h-screen font-nunito p-4 md:p-14">
            <h1 className="font-bold text-4xl md:text-5xl text-center text-amber-950 drop-shadow-[0_2px_10px_rgba(255,255,255,0.5)] mb-8">
                Admin Profile
            </h1>
            <div className="max-w-md mx-auto bg-white/25 backdrop-blur-xl border border-white/50 rounded-3xl p-6 shadow-[0_8px_32px_rgba(120,72,10,0.12)]">
                <p className="text-amber-900/80 mb-1">Signed in as</p>
                <p className="text-xl font-bold text-amber-950 break-words mb-6">
                    {user ? user.email : "Loading…"}
                </p>
                <div className="flex flex-col gap-3">
                    <button
                        onClick={handlePasswordReset}
                        className="bg-white/40 backdrop-blur-md border border-white/60 text-amber-950 hover:bg-white/55 font-bold px-5 py-2.5 rounded-xl transition-all duration-200 active:scale-95"
                    >
                        Send Password Reset Email
                    </button>
                    <button
                        onClick={handleSignOut}
                        className="bg-red-500/85 backdrop-blur-md border border-red-300/50 text-white hover:bg-red-600/90 font-bold px-5 py-2.5 rounded-xl transition-all duration-200 active:scale-95"
                    >
                        Sign Out
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
