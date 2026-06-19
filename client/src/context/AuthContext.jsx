import React from "react";
import api from '../utils/axios';
export const AuthContext = React.createContext();

export const AuthProvider=({ children})=>{
    const [user, setUser] = React.useState(null);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(()=>{
        const storageUser = localStorage.getItem("user");
        if(storageUser){
            setUser(JSON.parse(storageUser));
        }
        setLoading(false);
    }, []);

    const login = async (email, password) =>{
        try {
            const {data} = await api.post('/auth/login', {email, password});
            setUser(data);
            localStorage.setItem("user", JSON.stringify(data));
            localStorage.setItem("token", data.token);
            return data;
        } catch (err) {
            console.error("Login failed", err);
            throw err;
        }
    };

    const register = async (name, email, password) =>{
        try{
            const {data}= await api.post('/auth/register', {name, email, password});
            setUser(data);
            return data;
        }
        catch(err){
            console.error("Registration failed:", err);
            throw err;
        }
    }

    const verifyOtp = async (email, otp)=>{
        try {
            const {data} = await api.post('/auth/verify-otp', {email, otp});
            setUser(data);
            localStorage.setItem("user", JSON.stringify(data));
            localStorage.setItem("token", data.token);
            return data;
        } catch (err) {
            console.error("Otp verification failed", err);
            throw err;
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem("user");
        localStorage.removeItem("token");
    };

    return (
        <AuthContext.Provider value = {{user, loading, login, logout, verifyOTP:verifyOtp, register}}>
            {children}
        </AuthContext.Provider>
    );

};