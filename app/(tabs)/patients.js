// app/(tabs)/patients.js
import React, { useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    TextInput, Alert,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getAllPatients, deletePatient } from '../../services/database';
import { COLORS, SPACING, RADIUS } from '../../constants/theme';

export default function PatientsScreen() {
    const router = useRouter();
    const [patients, setPatients] = useState([]);
    const [search, setSearch] = useState('');

    useFocusEffect(
        useCallback(() => {
            loadPatients();
        }, [])
    );

    const loadPatients = async () => {
        const data = await getAllPatients();
        setPatients(data);
    };

    const filtered = patients.filter(p => {
        const q = search.toLowerCase();
        return (
            (p.full_name || '').toLowerCase().includes(q) ||
            (p.phone_number || '').includes(q)
        );
    });

    const confirmDelete = (id, name) => {
        Alert.alert(
            'Delete Patient',
            `Are you sure you want to delete "${name}"? This cannot be undone.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete', style: 'destructive',
                    onPress: async () => {
                        await deletePatient(id);
                        loadPatients();
                    },
                },
            ]
        );
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity
            style={styles.row}
            onPress={() => router.push(`/patient/${item.id}`)}
            activeOpacity={0.8}
        >
            <View style={styles.avatar}>
                <Text style={styles.avatarText}>{(item.full_name || '?').charAt(0).toUpperCase()}</Text>
            </View>
            <View style={styles.info}>
                <Text style={styles.name}>{item.full_name}</Text>
                <Text style={styles.sub}>{item.phone_number || '—'}</Text>
                {item.core_reason ? <Text style={styles.reason}>{item.core_reason}</Text> : null}
            </View>
            <View style={styles.rowActions}>
                <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => confirmDelete(item.id, item.full_name)}
                >
                    <Ionicons name="trash-outline" size={18} color={COLORS.error} />
                </TouchableOpacity>
                <Ionicons name="chevron-forward" size={18} color={COLORS.textDim} />
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            {/* Search + Add */}
            <View style={styles.topBar}>
                <View style={styles.searchWrap}>
                    <Ionicons name="search-outline" size={18} color={COLORS.textDim} style={{ marginRight: 8 }} />
                    <TextInput
                        style={styles.searchInput}
                        value={search}
                        onChangeText={setSearch}
                        placeholder="Search by name or phone..."
                        placeholderTextColor={COLORS.textDim}
                    />
                    {search ? (
                        <TouchableOpacity onPress={() => setSearch('')}>
                            <Ionicons name="close-circle" size={18} color={COLORS.textDim} />
                        </TouchableOpacity>
                    ) : null}
                </View>
                <TouchableOpacity
                    style={styles.addBtn}
                    onPress={() => router.push('/add-patient')}
                >
                    <Ionicons name="person-add-outline" size={20} color="#fff" />
                </TouchableOpacity>
            </View>

            {/* Count */}
            <Text style={styles.count}>{filtered.length} patient{filtered.length !== 1 ? 's' : ''}</Text>

            <FlatList
                data={filtered}
                keyExtractor={item => String(item.id)}
                renderItem={renderItem}
                contentContainerStyle={styles.list}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Ionicons name="people-outline" size={48} color={COLORS.textDim} />
                        <Text style={styles.emptyText}>
                            {search ? 'No patients match your search.' : 'No patients yet. Add one!'}
                        </Text>
                    </View>
                }
                ItemSeparatorComponent={() => <View style={styles.sep} />}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bg },
    topBar: {
        flexDirection: 'row',
        gap: SPACING.sm,
        padding: SPACING.md,
        paddingBottom: 0,
    },
    searchWrap: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.md,
        borderWidth: 1,
        borderColor: COLORS.border,
        paddingHorizontal: SPACING.md,
        height: 46,
    },
    searchInput: { flex: 1, color: COLORS.text, fontSize: 14 },
    addBtn: {
        width: 46, height: 46,
        backgroundColor: COLORS.primary,
        borderRadius: RADIUS.md,
        alignItems: 'center', justifyContent: 'center',
    },
    count: {
        color: COLORS.textMuted,
        fontSize: 12,
        fontWeight: '600',
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
    },
    list: { padding: SPACING.md, paddingTop: 0 },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.lg,
        borderWidth: 1,
        borderColor: COLORS.border,
        padding: SPACING.md,
        gap: SPACING.sm,
    },
    avatar: {
        width: 42, height: 42,
        borderRadius: 21,
        backgroundColor: COLORS.primary + '33',
        alignItems: 'center', justifyContent: 'center',
    },
    avatarText: { color: COLORS.primaryLight, fontWeight: '700', fontSize: 18 },
    info: { flex: 1 },
    name: { color: COLORS.white, fontWeight: '700', fontSize: 15 },
    sub: { color: COLORS.textMuted, fontSize: 12, marginTop: 2 },
    reason: {
        color: COLORS.primaryLight,
        fontSize: 11,
        marginTop: 3,
        backgroundColor: COLORS.primary + '22',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
        alignSelf: 'flex-start',
    },
    rowActions: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
    deleteBtn: {
        padding: 6,
        backgroundColor: COLORS.error + '22',
        borderRadius: RADIUS.sm,
    },
    sep: { height: SPACING.sm },
    empty: {
        alignItems: 'center',
        paddingVertical: SPACING.xxl,
        gap: SPACING.md,
    },
    emptyText: { color: COLORS.textDim, fontSize: 15, textAlign: 'center' },
});
