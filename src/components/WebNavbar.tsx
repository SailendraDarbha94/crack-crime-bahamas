"use client"
import { BUTTON, BUTTON_SM, buttonClass } from "@/components/ui/buttonStyles";
import app from '@/lib/firebase';
import { ToastContext } from '@/lib/toastContext';
import { getAuth, signOut } from 'firebase/auth';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import React, { useContext, useEffect, useState } from 'react';
import TipFormLink from './TipFormLink';

const WebNavbar: React.FC = () => {
    const { toast } = useContext(ToastContext);
    const router = useRouter();
    const [loading, setLoading] = useState<boolean>(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
    const pathname = usePathname();
    // Which menu to show. Signed-in areas get account controls; the database
    // rules, not this, decide what each role can actually read.
    const section: "admin" | "police" | "public" =
        pathname.startsWith("/admin") ? "admin" : pathname.startsWith("/police") ? "police" : "public";
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

    // Close the mobile menu whenever the route changes
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [pathname]);

    // The look of a menu entry, for the one entry that is not a NavLink: the
    // tip form link, which must be a full page load (see TipFormLink).
    // Every entry takes the site's one button look (see buttonStyles.ts). The
    // bar across the top of a wide screen uses the small size, so that five
    // entries fit beside the name; the drop-down menu on a phone uses the
    // ordinary size, which is easier to tap. The tip form link is not a
    // NavLink (it must be a full page load: see TipFormLink), so it is given
    // the same classes directly.

    const NavLink = ({ href, children, onClick, logout = false, compact = false }: {
        href?: string;
        children: React.ReactNode;
        onClick?: () => void;
        /** The Logout entry: it looks like the others, and says so while signing out. */
        logout?: boolean;
        /** For the bar across the top of a wide screen. */
        compact?: boolean;
    }) => {
        const classes = buttonClass({ size: compact ? "sm" : "md" });

        if (onClick) {
            return (
                <button
                    onClick={onClick}
                    disabled={loading}
                    className={classes}
                >
                    {loading && logout ? (
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-amber-900/30 border-t-amber-900 rounded-full animate-spin"></div>
                            <span>Logging out...</span>
                        </div>
                    ) : (
                        children
                    )}
                </button>
            );
        }

        return (
            <Link
                href={href ?? "#"}
                className={classes}
            >
                {children}
            </Link>
        );
    };

    return (
        <nav className="relative">
            {/* Main Navbar */}
            <div className="mx-4 my-1.5 rounded-3xl bg-white/20 backdrop-blur-xl border border-white/50 shadow-[0_8px_32px_rgba(120,72,10,0.18)]">
                <div className="px-6 py-4">
                    <div className="flex items-center justify-between">
                        {/* Logo */}
                        <div className="flex items-center">
                            <div className="text-amber-950 font-bold text-xl md:text-2xl font-nunito tracking-tight">
                                Crack Crime Bahamas
                            </div>
                        </div>
                        {/* Desktop Navigation */}
                        {section !== "public" ? (
                            <div className="hidden md:flex items-center space-x-3">
                                <NavLink href={`/${section}/profile`} compact>
                                    <div className="flex items-center gap-3">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                        Profile
                                    </div>
                                </NavLink>
                                <NavLink onClick={logoutUser} logout compact>
                                    <div className="flex items-center gap-2">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                        </svg>
                                        Logout
                                    </div>
                                </NavLink>
                            </div>
                        ) : (
                            <div className="hidden md:flex items-center space-x-2 lg:space-x-3">
                                <NavLink href="/" compact><span>Home</span></NavLink>
                                <TipFormLink className={BUTTON_SM}><span>Submit a Tip</span></TipFormLink>
                                <NavLink href="/member" compact><span>Sponsor</span></NavLink>
                                <NavLink href="/more-about-us" compact><span>About</span></NavLink>
                                <NavLink href="/contact" compact><span>Contact</span></NavLink>
                            </div>
                        )}


                        {/* Mobile Menu Button */}
                        <button
                            onClick={toggleMobileMenu}
                            className={`${BUTTON_SM} md:hidden`}
                            aria-label="Toggle mobile menu"
                        >
                            <div className="w-6 h-6 flex flex-col justify-center items-center">
                                <div className={`w-5 h-0.5 bg-amber-950 rounded-full transition-all duration-300 ${isMobileMenuOpen ? 'rotate-45 translate-y-1.5' : ''}`}></div>
                                <div className={`w-5 h-0.5 bg-amber-950 rounded-full mt-1 transition-all duration-300 ${isMobileMenuOpen ? 'opacity-0' : ''}`}></div>
                                <div className={`w-5 h-0.5 bg-amber-950 rounded-full mt-1 transition-all duration-300 ${isMobileMenuOpen ? '-rotate-45 -translate-y-1.5' : ''}`}></div>
                            </div>
                        </button>
                    </div>
                </div>

                {/* Mobile Navigation Menu */}
                <div className={`md:hidden overflow-hidden transition-all duration-300 ease-out ${isMobileMenuOpen ? 'max-h-[36rem] opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className="px-6 pb-4 border-t border-amber-900/15">
                        {section === "admin" ? (
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
                                <NavLink href="/admin/messages"><div className="flex items-center gap-3">Tip Messages</div></NavLink>
                                <NavLink href="/admin/archive"><div className="flex items-center gap-3">Archive</div></NavLink>
                                <NavLink href="/admin/notifications"><div className="flex items-center gap-3">Notifications</div></NavLink>
                                <NavLink href="/admin/adverts"><div className="flex items-center gap-3">Advertisements</div></NavLink>
                                <NavLink href="/admin/team"><div className="flex items-center gap-3">Police Team</div></NavLink>
                                <NavLink onClick={logoutUser} logout>
                                    <div className="flex items-center gap-3">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                        </svg>
                                        Logout
                                    </div>
                                </NavLink>
                            </div>
                        ) : section === "police" ? (
                            <div className="flex flex-col space-y-3 pt-4">
                                <NavLink href="/police"><div className="flex items-center gap-3">Home</div></NavLink>
                                <NavLink href="/police/tips"><div className="flex items-center gap-3">Forwarded Tips</div></NavLink>
                                <NavLink href="/police/missing"><div className="flex items-center gap-3">Missing Persons</div></NavLink>
                                <NavLink href="/police/wanted"><div className="flex items-center gap-3">Wanted Persons</div></NavLink>
                                <NavLink href="/police/profile"><div className="flex items-center gap-3">Profile</div></NavLink>
                                <NavLink onClick={logoutUser} logout><div className="flex items-center gap-3">Logout</div></NavLink>
                            </div>
                        ) : (
                            <div className="flex flex-col space-y-3 pt-4">
                                <NavLink href="/"><div className="flex items-center gap-3">Home</div></NavLink>
                                <TipFormLink className={BUTTON}><div className="flex items-center gap-3">Submit a Tip</div></TipFormLink>
                                <NavLink href="/member"><div className="flex items-center gap-3">Become a Sponsor</div></NavLink>
                                <NavLink href="/more-about-us"><div className="flex items-center gap-3">About Us</div></NavLink>
                                <NavLink href="/contact"><div className="flex items-center gap-3">Contact</div></NavLink>
                            </div>
                        )}

                    </div>
                </div>
            </div>
        </nav>
    );
};

export default WebNavbar;