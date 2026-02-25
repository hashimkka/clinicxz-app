// app/(tabs)/_layout.js — Bottom Tab Navigator
import { Tabs } from 'expo-router';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { COLORS } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
    const { user } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!user) router.replace('/');
    }, [user]);

    return (
        <Tabs
            screenOptions={{
                tabBarStyle: {
                    backgroundColor: COLORS.surface,
                    borderTopColor: COLORS.border,
                    paddingBottom: 4,
                    height: 60,
                },
                tabBarActiveTintColor: COLORS.primaryLight,
                tabBarInactiveTintColor: COLORS.textMuted,
                headerStyle: { backgroundColor: COLORS.surface },
                headerTintColor: COLORS.text,
                headerTitleStyle: { fontWeight: '700' },
            }}
        >
            <Tabs.Screen
                name="dashboard"
                options={{
                    title: 'Dashboard',
                    tabBarIcon: ({ color, size }) => <Ionicons name="grid-outline" size={size} color={color} />,
                }}
            />
            <Tabs.Screen
                name="patients"
                options={{
                    title: 'Patients',
                    tabBarIcon: ({ color, size }) => <Ionicons name="people-outline" size={size} color={color} />,
                }}
            />
            <Tabs.Screen
                name="schedule"
                options={{
                    title: 'Schedule',
                    tabBarIcon: ({ color, size }) => <Ionicons name="calendar-outline" size={size} color={color} />,
                }}
            />
        </Tabs>
    );
}
