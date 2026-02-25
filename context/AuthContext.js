// context/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { loginUser } from '../services/database';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        AsyncStorage.getItem('clinicxz_user').then(val => {
            if (val) setUser(JSON.parse(val));
            setLoading(false);
        });
    }, []);

    const login = async (username, password) => {
        const found = await loginUser(username, password);
        if (found) {
            setUser(found);
            await AsyncStorage.setItem('clinicxz_user', JSON.stringify(found));
            return true;
        }
        return false;
    };

    const logout = async () => {
        setUser(null);
        await AsyncStorage.removeItem('clinicxz_user');
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
