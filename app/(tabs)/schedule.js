// app/(tabs)/schedule.js
import React, { useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
    TextInput, Modal,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
    getSchedule, addScheduleEvent, updateScheduleStatus, deleteScheduleEvent,
} from '../../services/database';
import { COLORS, SPACING, RADIUS } from '../../constants/theme';

const STATUS_COLORS = {
    Scheduled: { bg: '#1e3a5f', text: '#93c5fd' },
    Completed: { bg: '#14532d', text: '#86efac' },
    Canceled: { bg: '#451a03', text: '#fcd34d' },
};

export default function ScheduleScreen() {
    const [events, setEvents] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({ title: '', time: '' });

    useFocusEffect(useCallback(() => { loadSchedule(); }, []));

    const loadSchedule = async () => {
        const data = await getSchedule();
        setEvents(data);
    };

    const handleAdd = async () => {
        if (!form.title.trim() || !form.time.trim()) {
            Alert.alert('Error', 'Please fill in all fields.');
            return;
        }
        await addScheduleEvent(form);
        setForm({ title: '', time: '' });
        setShowModal(false);
        loadSchedule();
    };

    const handleStatus = (id, status) => {
        Alert.alert('Update Status', `Mark as ${status}?`, [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Yes', onPress: async () => { await updateScheduleStatus(id, status); loadSchedule(); } },
        ]);
    };

    const handleDelete = (id, title) => {
        Alert.alert('Delete', `Delete "${title}"?`, [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: async () => { await deleteScheduleEvent(id); loadSchedule(); } },
        ]);
    };

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.content}>
                {events.length === 0 ? (
                    <View style={styles.empty}>
                        <Ionicons name="calendar-outline" size={48} color={COLORS.textDim} />
                        <Text style={styles.emptyText}>No events scheduled.</Text>
                    </View>
                ) : (
                    events.map(ev => {
                        const sc = STATUS_COLORS[ev.status] || STATUS_COLORS.Scheduled;
                        return (
                            <View key={ev.id} style={styles.card}>
                                <View style={styles.cardTop}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.evTitle}>{ev.title}</Text>
                                        <View style={styles.evTimeRow}>
                                            <Ionicons name="time-outline" size={13} color={COLORS.textMuted} />
                                            <Text style={styles.evTime}>{ev.time}</Text>
                                        </View>
                                    </View>
                                    <View style={[styles.badge, { backgroundColor: sc.bg }]}>
                                        <Text style={[styles.badgeText, { color: sc.text }]}>{ev.status}</Text>
                                    </View>
                                </View>

                                <View style={styles.cardActions}>
                                    {ev.status === 'Scheduled' && (
                                        <>
                                            <TouchableOpacity
                                                style={[styles.actionBtn, { backgroundColor: '#14532d' }]}
                                                onPress={() => handleStatus(ev.id, 'Completed')}
                                            >
                                                <Text style={[styles.actionBtnText, { color: '#86efac' }]}>Complete</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={[styles.actionBtn, { backgroundColor: '#451a03' }]}
                                                onPress={() => handleStatus(ev.id, 'Canceled')}
                                            >
                                                <Text style={[styles.actionBtnText, { color: '#fcd34d' }]}>Cancel</Text>
                                            </TouchableOpacity>
                                        </>
                                    )}
                                    <TouchableOpacity
                                        style={[styles.actionBtn, { backgroundColor: COLORS.error + '22' }]}
                                        onPress={() => handleDelete(ev.id, ev.title)}
                                    >
                                        <Ionicons name="trash-outline" size={15} color={COLORS.error} />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        );
                    })
                )}
            </ScrollView>

            {/* FAB */}
            <TouchableOpacity style={styles.fab} onPress={() => setShowModal(true)}>
                <Ionicons name="add" size={28} color="#fff" />
            </TouchableOpacity>

            {/* Add Modal */}
            <Modal visible={showModal} transparent animationType="slide">
                <View style={styles.overlay}>
                    <View style={styles.modal}>
                        <Text style={styles.modalTitle}>Add Appointment</Text>

                        <Text style={styles.label}>Name / Title</Text>
                        <TextInput
                            style={styles.input}
                            value={form.title}
                            onChangeText={t => setForm(f => ({ ...f, title: t }))}
                            placeholder="Patient name or title"
                            placeholderTextColor={COLORS.textDim}
                        />

                        <Text style={styles.label}>Date & Time</Text>
                        <TextInput
                            style={styles.input}
                            value={form.time}
                            onChangeText={t => setForm(f => ({ ...f, time: t }))}
                            placeholder="e.g. 2026-02-25 10:00"
                            placeholderTextColor={COLORS.textDim}
                        />

                        <View style={styles.modalBtns}>
                            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowModal(false)}>
                                <Text style={styles.cancelBtnText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.saveBtn} onPress={handleAdd}>
                                <Text style={styles.saveBtnText}>Add Event</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bg },
    content: { padding: SPACING.md, paddingBottom: 90 },
    empty: { alignItems: 'center', marginTop: SPACING.xxl, gap: SPACING.md },
    emptyText: { color: COLORS.textDim, fontSize: 15 },
    card: {
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.lg,
        borderWidth: 1,
        borderColor: COLORS.border,
        padding: SPACING.md,
        marginBottom: SPACING.sm,
    },
    cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm, marginBottom: SPACING.sm },
    evTitle: { color: COLORS.white, fontWeight: '700', fontSize: 15 },
    evTimeRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
    evTime: { color: COLORS.textMuted, fontSize: 12 },
    badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    badgeText: { fontSize: 11, fontWeight: '700' },
    cardActions: { flexDirection: 'row', gap: SPACING.sm },
    actionBtn: {
        paddingVertical: 6, paddingHorizontal: SPACING.md,
        borderRadius: RADIUS.sm,
        alignItems: 'center', justifyContent: 'center',
    },
    actionBtnText: { fontSize: 12, fontWeight: '600' },
    fab: {
        position: 'absolute', bottom: SPACING.xl, right: SPACING.xl,
        width: 56, height: 56,
        borderRadius: 28,
        backgroundColor: COLORS.primary,
        alignItems: 'center', justifyContent: 'center',
        elevation: 8,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
    },
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
    modal: {
        backgroundColor: COLORS.surface,
        borderTopLeftRadius: RADIUS.xl,
        borderTopRightRadius: RADIUS.xl,
        padding: SPACING.xl,
        borderTopWidth: 1,
        borderColor: COLORS.border,
    },
    modalTitle: { fontSize: 20, fontWeight: '700', color: COLORS.white, marginBottom: SPACING.lg },
    label: { color: COLORS.textMuted, fontSize: 13, fontWeight: '500', marginBottom: 6 },
    input: {
        backgroundColor: COLORS.bg,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: RADIUS.md,
        paddingHorizontal: SPACING.md,
        paddingVertical: 13,
        color: COLORS.text,
        fontSize: 15,
        marginBottom: SPACING.md,
    },
    modalBtns: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.sm },
    cancelBtn: {
        flex: 1, padding: 13, backgroundColor: COLORS.surfaceHover,
        borderRadius: RADIUS.md, alignItems: 'center',
    },
    cancelBtnText: { color: COLORS.text, fontWeight: '600' },
    saveBtn: {
        flex: 2, padding: 13, backgroundColor: COLORS.primary,
        borderRadius: RADIUS.md, alignItems: 'center',
    },
    saveBtnText: { color: '#fff', fontWeight: '700' },
});
