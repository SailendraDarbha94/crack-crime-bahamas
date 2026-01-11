"use client"
import app from '@/lib/firebase';
import { ToastContext } from '@/lib/toastContext';
import { getAuth, signOut } from 'firebase/auth';
import { usePathname, useRouter } from 'next/navigation';
import React, { useContext, useEffect, useState } from 'react';

const WebNavbar: React.FC = () => {
    const { toast } = useContext(ToastContext);
    const router = useRouter();
    const [loading, setLoading] = useState<boolean>(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
    const pathname = usePathname();
    const logoutUser = async () => {
        setLoading(true);
        const auth = await getAuth(app);
        try {
            await signOut(auth);
            setLoading(false);
            toast({
                type: "success",
                message: "User Logged Out! Redirecting",
            });
            router.push("/");
        } catch (err) {
            setLoading(false);
            console.log(JSON.stringify(err));
            toast({
                type: "error",
                message: "Logout failed. Please try again.",
            });
        }
    };


    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    const NavLink = ({ href, children, onClick, variant = "primary" }: {
        href?: string;
        children: React.ReactNode;
        onClick?: () => void;
        variant?: "primary" | "danger";
    }) => {
        const baseClasses = "relative px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ease-out transform active:scale-95";
        const variantClasses = {
            primary: "bg-slate-300 hover:bg-slate-200 text-black  hover:border-white/30",
            danger: "bg-red-600/90 backdrop-blur-sm hover:bg-red-500/90 text-white   hover:border-red-300/50"
        };

        if (onClick) {
            return (
                <button
                    onClick={onClick}
                    disabled={loading}
                    className={`${baseClasses} ${variantClasses[variant]} disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                    {loading && variant === "danger" ? (
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            <span>Logging out...</span>
                        </div>
                    ) : (
                        children
                    )}
                </button>
            );
        }

        return (
            <a
                href={href}
                className={`${baseClasses} ${variantClasses[variant]} inline-block`}
            >
                {children}
            </a>
        );
    };

    useEffect(() => {
        if (pathname.includes("admin")) {
            console.log("admin route")
        }
    }, [])

    return (
        <nav className="relative">
            {/* Main Navbar */}
            <div className="mx-4 my-1.5 rounded-3xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-300">
                <div className="px-6 py-4">
                    <div className="flex items-center justify-between">
                        {/* Logo */}
                        <div className="flex items-center">
                            <div className="text-white font-bold text-xl md:text-2xl font-nunito tracking-tight">
                                Crack Crime Bahamas
                            </div>
                        </div>
                        {/* Desktop Navigation */}
                        {pathname.includes("admin") ? (
                            <div className="hidden md:flex items-center space-x-3">
                                {/* <NavLink href="/admin">
                                    <div className="flex items-center gap-3">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                        </svg>
                                        Home
                                    </div>
                                </NavLink> */}
                                <NavLink href="/admin/profile">
                                    <div className="flex items-center gap-3">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                        Profile
                                    </div>
                                </NavLink>
                                <NavLink onClick={logoutUser} variant="danger">
                                    <div className="flex items-center gap-2">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                        </svg>
                                        Logout
                                    </div>
                                </NavLink>
                            </div>
                        ) : (
                            <div className="hidden md:flex items-center space-x-3">
                                <NavLink href="/">
                                    <div className="flex items-center gap-3">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                        </svg>
                                        Home
                                    </div>
                                </NavLink>
                                <NavLink href="/more-about-us">
                                    <div className="flex items-center gap-3">
                                        {/* <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg> */}
                                        About Us
                                    </div>
                                </NavLink>
                                {/* <NavLink href="/contact">
                                    <div className="flex items-center gap-2">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                        </svg>
                                        Contact
                                    </div>
                                </NavLink> */}
                            </div>
                        )}


                        {/* Mobile Menu Button */}
                        <button
                            onClick={toggleMobileMenu}
                            className="md:hidden p-2 rounded-xl bg-white/10 hover:bg-white border border-slate-700 transition-all duration-200 ease-out transform active:scale-95"
                            aria-label="Toggle mobile menu"
                        >
                            <div className="w-6 h-6 flex flex-col justify-center items-center">
                                <div className={`w-5 h-0.5 bg-slate-700 rounded-full transition-all duration-300 ${isMobileMenuOpen ? 'rotate-45 translate-y-1.5' : ''}`}></div>
                                <div className={`w-5 h-0.5 bg-slate-700 rounded-full mt-1 transition-all duration-300 ${isMobileMenuOpen ? 'opacity-0' : ''}`}></div>
                                <div className={`w-5 h-0.5 bg-slate-700 rounded-full mt-1 transition-all duration-300 ${isMobileMenuOpen ? '-rotate-45 -translate-y-1.5' : ''}`}></div>
                            </div>
                        </button>
                    </div>
                </div>

                {/* Mobile Navigation Menu */}
                <div className={`md:hidden overflow-hidden transition-all duration-300 ease-out ${isMobileMenuOpen ? 'max-h-80 opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className="px-6 pb-4 border-t border-white/10">
                        {pathname.includes("admin") ? (
                            <div className="flex flex-col space-y-3 pt-4">
                                <NavLink href="/admin">
                                    <div className="flex items-center gap-3">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                        </svg>
                                        Home
                                    </div>
                                </NavLink>
                                <NavLink href="/admin/profile">
                                    <div className="flex items-center gap-3">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                        Profile
                                    </div>
                                </NavLink>
                                <NavLink href="/admin/missing">
                                    <div className="flex items-center gap-3">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                        Missing Persons
                                    </div>
                                </NavLink>
                                <NavLink href="/admin/wanted">
                                    <div className="flex items-center gap-3">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                        </svg>
                                        Wanted Persons
                                    </div>
                                </NavLink>
                                <NavLink onClick={logoutUser} variant="danger">
                                    <div className="flex items-center gap-3">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                        </svg>
                                        Logout
                                    </div>
                                </NavLink>
                                {/* <NavLink onClick={logoutUser} variant="danger">
                                    <div className="flex items-center gap-3">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                        </svg>
                                        Logout
                                    </div>
                                </NavLink> */}
                            </div>
                        ) : (
                            <div className="flex flex-col space-y-3 pt-4">
                                <NavLink href="/">
                                    <div className="flex items-center gap-3">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                        </svg>
                                        Home
                                    </div>
                                </NavLink>
                                <NavLink href="/more-about-us">
                                    <div className="flex items-center gap-3">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                        About Us
                                    </div>
                                </NavLink>
                                {/* <NavLink onClick={logoutUser} variant="danger">
                                    <div className="flex items-center gap-3">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                        </svg>
                                        Logout
                                    </div>
                                </NavLink> */}
                            </div>
                        )}

                    </div>
                </div>
            </div>
        </nav>
    );
};

export default WebNavbar;