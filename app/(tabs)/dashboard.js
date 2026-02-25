// app/(tabs)/dashboard.js
import React, { useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { getAllPatients, getSchedule } from '../../services/database';
import { COLORS, SPACING, RADIUS } from '../../constants/theme';

export default function DashboardScreen() {
    const { user, logout } = useAuth();
    const router = useRouter();
    const [stats, setStats] = useState({ total: 0, upcoming: 0 });
    const [recentPatients, setRecentPatients] = useState([]);

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [])
    );

    const loadData = async () => {
        const [patients, schedule] = await Promise.all([getAllPatients(), getSchedule()]);
        const upcoming = schedule.filter(e => e.status === 'Scheduled').length;
        setStats({ total: patients.length, upcoming });
        setRecentPatients(patients.slice(0, 8));
    };

    const handleLogout = () => {
        Alert.alert('Logout', 'Are you sure you want to logout?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Logout', style: 'destructive', onPress: logout },
        ]);
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.welcome}>Welcome back 👋</Text>
                    <Text style={styles.username}>{user?.username || 'Admin'}</Text>
                </View>
                <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                    <Ionicons name="log-out-outline" size={22} color={COLORS.textMuted} />
                </TouchableOpacity>
            </View>

            {/* Stats Cards */}
            <View style={styles.statsRow}>
                <View style={[styles.statCard, { borderLeftColor: COLORS.primary }]}>
                    <Ionicons name="people" size={28} color={COLORS.primary} />
                    <Text style={styles.statNum}>{stats.total}</Text>
                    <Text style={styles.statLabel}>Total Patients</Text>
                </View>
                <View style={[styles.statCard, { borderLeftColor: COLORS.warning }]}>
                    <Ionicons name="calendar" size={28} color={COLORS.warning} />
                    <Text style={styles.statNum}>{stats.upcoming}</Text>
                    <Text style={styles.statLabel}>Upcoming Appts</Text>
                </View>
            </View>

            {/* Quick Actions */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Quick Actions</Text>
                <View style={styles.actionsRow}>
                    <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => router.push('/add-patient')}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="person-add" size={24} color={COLORS.primaryLight} />
                        <Text style={styles.actionLabel}>Add Patient</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => router.push('/(tabs)/patients')}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="search" size={24} color={COLORS.primaryLight} />
                        <Text style={styles.actionLabel}>All Patients</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => router.push('/(tabs)/schedule')}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="calendar-outline" size={24} color={COLORS.primaryLight} />
                        <Text style={styles.actionLabel}>Schedule</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Recent Patients */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Recent Patients</Text>
                <View style={styles.card}>
                    {recentPatients.length === 0 ? (
                        <Text style={styles.emptyText}>No patients added yet.</Text>
                    ) : (
                        recentPatients.map((p, i) => (
                            <TouchableOpacity
                                key={p.id}
                                style={[styles.patientRow, i < recentPatients.length - 1 && styles.patientRowBorder]}
                                onPress={() => router.push(`/patient/${p.id}`)}
                                activeOpacity={0.7}
                            >
                                <View style={styles.avatar}>
                                    <Text style={styles.avatarText}>{(p.full_name || '?').charAt(0).toUpperCase()}</Text>
                                </View>
                                <View style={styles.patientInfo}>
                                    <Text style={styles.patientName}>{p.full_name}</Text>
                                    <Text style={styles.patientSub}>{p.core_reason || p.phone_number || '—'}</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={18} color={COLORS.textDim} />
                            </TouchableOpacity>
                        ))
                    )}
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bg },
    content: { padding: SPACING.lg, paddingBottom: SPACING.xxl },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.lg,
    },
    welcome: { color: COLORS.textMuted, fontSize: 13 },
    username: { color: COLORS.white, fontSize: 22, fontWeight: '800' },
    logoutBtn: {
        padding: SPACING.sm,
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.md,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    statsRow: { flexDirection: 'row', gap: SPACING.md, marginBottom: SPACING.lg },
    statCard: {
        flex: 1,
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.lg,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderLeftWidth: 4,
        padding: SPACING.md,
        alignItems: 'flex-start',
        gap: 4,
    },
    statNum: { fontSize: 28, fontWeight: '800', color: COLORS.white },
    statLabel: { fontSize: 12, color: COLORS.textMuted, fontWeight: '500' },
    section: { marginBottom: SPACING.lg },
    sectionTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: COLORS.white,
        marginBottom: SPACING.sm,
    },
    actionsRow: { flexDirection: 'row', gap: SPACING.sm },
    actionBtn: {
        flex: 1,
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.lg,
        borderWidth: 1,
        borderColor: COLORS.border,
        padding: SPACING.md,
        alignItems: 'center',
        gap: SPACING.xs,
    },
    actionLabel: { color: COLORS.text, fontSize: 12, fontWeight: '600', textAlign: 'center' },
    card: {
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.lg,
        borderWidth: 1,
        borderColor: COLORS.border,
        overflow: 'hidden',
    },
    patientRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.md,
        gap: SPACING.sm,
    },
    patientRowBorder: {
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    avatar: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: COLORS.primary + '33',
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: { color: COLORS.primaryLight, fontWeight: '700', fontSize: 16 },
    patientInfo: { flex: 1 },
    patientName: { color: COLORS.white, fontWeight: '600', fontSize: 14 },
    patientSub: { color: COLORS.textMuted, fontSize: 12, marginTop: 2 },
    emptyText: { color: COLORS.textDim, textAlign: 'center', padding: SPACING.lg },
});
