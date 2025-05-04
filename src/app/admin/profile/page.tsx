"use client"
import app from '@/lib/firebase';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';

const ProfilePage: React.FC = () => {

    const router = useRouter();
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const auth = getAuth(app);
        onAuthStateChanged(auth, (user) => {
            if (user) {
                console.log("USER DETAILS", user);
                setUser(user);
            } else {
                router.push("/login");
            }
        });
    }, []);



    
    return (
        <div>
            <h1>Admin Profile</h1>
            <p>Welcome to the admin profile page.</p>
            <h2 className="text-xl p-2 underline font-nunito bg-red-400">
                {user ? user.email : null}
            </h2>
        </div>
    );
};

export default ProfilePage;