// app/_layout.js
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '../context/AuthContext';
import { initDatabase } from '../services/database';
import { COLORS } from '../constants/theme';

export default function RootLayout() {
    useEffect(() => {
        initDatabase().catch(console.error);
    }, []);

    return (
        <AuthProvider>
            <StatusBar style="light" backgroundColor={COLORS.bg} />
            <Stack
                screenOptions={{
                    headerStyle: { backgroundColor: COLORS.surface },
                    headerTintColor: COLORS.text,
                    headerTitleStyle: { fontWeight: 'bold' },
                    contentStyle: { backgroundColor: COLORS.bg },
                    animation: 'slide_from_right',
                }}
            >
                <Stack.Screen name="index" options={{ headerShown: false }} />
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen
                    name="add-patient"
                    options={{ title: 'Add New Patient', headerBackTitle: 'Back' }}
                />
                <Stack.Screen
                    name="patient/[id]"
                    options={{ title: 'Patient Details', headerBackTitle: 'Back' }}
                />
            </Stack>
        </AuthProvider>
    );
}
