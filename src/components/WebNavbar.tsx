import app from '@/lib/firebase';
import { ToastContext } from '@/lib/toastContext';
import { getAuth, signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import React, { useContext, useState } from 'react';

const WebNavbar: React.FC = () => {

    const { toast } = useContext(ToastContext);
    const router = useRouter();
    const [loading, setLoading] = useState<boolean>(false);
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
        }
    };

    return (
        <nav style={styles.navbar} className='font-nunito font-bold bg-yellow-300 border-2 border-black'>
            <div style={styles.logo}>Crack Crime Bahamas</div>
            <ul style={styles.navLinks}>
                <li style={styles.navItem} className='bg-purple-700 px-3 py-1 rounded-md'><a href="/admin" style={styles.navLink}>Home</a></li>
                <li style={styles.navItem} className='bg-purple-700 px-3 py-1 rounded-md'><a href="/admin/profile" style={styles.navLink}>Profile</a></li>
                <li style={styles.navItem} className='bg-red-500 px-3 py-1 rounded-md hover:cursor-pointer' onClick={logoutUser}><span style={styles.navLink}>Logout</span></li>
            </ul>
        </nav>
    );
};

const styles = {
    navbar: {
        borderRadius: '8px',
        marginTop: '8px',
        marginRight: '8px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '10px 20px',
        //backgroundColor: '#333',
        color: '#000',
    },
    logo: {
        fontSize: '1.5rem',
        fontWeight: 'bold',
    },
    navLinks: {
        listStyle: 'none',
        display: 'flex',
        margin: 0,
        padding: 0,
    },
    navItem: {
        marginLeft: '20px',
    },
    navLink: {
        backgroundColor: '#',
        color: '#fff',
        textDecoration: 'none',
        fontSize: '1rem',
    },
};

export default WebNavbar;