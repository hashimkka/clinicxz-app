// app/index.js — Login Screen
import React, { useState, useEffect } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { COLORS, SPACING, RADIUS } from '../constants/theme';

export default function LoginScreen() {
    const { user, login, loading } = useAuth();
    const router = useRouter();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!loading && user) {
            router.replace('/(tabs)/dashboard');
        }
    }, [user, loading]);

    const handleLogin = async () => {
        if (!username.trim() || !password.trim()) {
            setError('Please enter username and password.');
            return;
        }
        setSubmitting(true);
        setError('');
        const ok = await login(username.trim(), password.trim());
        setSubmitting(false);
        if (!ok) {
            setError('Invalid username or password. Default: admin / admin123');
        }
    };

    if (loading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
                {/* Logo */}
                <View style={styles.logoWrap}>
                    <View style={styles.logoIcon}>
                        <Text style={styles.logoPlus}>+</Text>
                    </View>
                    <Text style={styles.logoText}>ClinicXZ</Text>
                    <Text style={styles.logoSub}>Clinic Management System</Text>
                </View>

                {/* Card */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Sign In</Text>

                    <View style={styles.field}>
                        <Text style={styles.label}>Username</Text>
                        <TextInput
                            style={styles.input}
                            value={username}
                            onChangeText={setUsername}
                            placeholder="Enter username"
                            placeholderTextColor={COLORS.textDim}
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                    </View>

                    <View style={styles.field}>
                        <Text style={styles.label}>Password</Text>
                        <TextInput
                            style={styles.input}
                            value={password}
                            onChangeText={setPassword}
                            placeholder="Enter password"
                            placeholderTextColor={COLORS.textDim}
                            secureTextEntry
                        />
                    </View>

                    {error ? <Text style={styles.error}>{error}</Text> : null}

                    <TouchableOpacity style={styles.btn} onPress={handleLogin} disabled={submitting} activeOpacity={0.85}>
                        {submitting
                            ? <ActivityIndicator color="#fff" />
                            : <Text style={styles.btnText}>Sign In</Text>
                        }
                    </TouchableOpacity>

                    <Text style={styles.hint}>Default login: admin / admin123</Text>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bg },
    inner: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.lg,
    },
    logoWrap: { alignItems: 'center', marginBottom: SPACING.xl },
    logoIcon: {
        width: 64, height: 64,
        borderRadius: 32,
        backgroundColor: COLORS.primary,
        alignItems: 'center', justifyContent: 'center',
        marginBottom: SPACING.md,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.5,
        shadowRadius: 16,
        elevation: 10,
    },
    logoPlus: { color: '#fff', fontSize: 32, fontWeight: '900' },
    logoText: { fontSize: 32, fontWeight: '800', color: COLORS.white, letterSpacing: 1 },
    logoSub: { color: COLORS.textMuted, fontSize: 13, marginTop: 4 },
    card: {
        width: '100%',
        maxWidth: 440,
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.xl,
        borderWidth: 1,
        borderColor: COLORS.border,
        padding: SPACING.xl,
    },
    cardTitle: { fontSize: 22, fontWeight: '700', color: COLORS.white, marginBottom: SPACING.lg },
    field: { marginBottom: SPACING.md },
    label: { fontSize: 13, color: COLORS.textMuted, fontWeight: '500', marginBottom: 6 },
    input: {
        backgroundColor: COLORS.bg,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: RADIUS.md,
        paddingHorizontal: SPACING.md,
        paddingVertical: 13,
        color: COLORS.text,
        fontSize: 15,
    },
    error: {
        color: COLORS.error,
        fontSize: 13,
        marginBottom: SPACING.md,
        textAlign: 'center',
    },
    btn: {
        backgroundColor: COLORS.primary,
        borderRadius: RADIUS.md,
        paddingVertical: 15,
        alignItems: 'center',
        marginTop: SPACING.sm,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
        elevation: 6,
    },
    btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
    hint: { color: COLORS.textDim, fontSize: 12, textAlign: 'center', marginTop: SPACING.md },
});
