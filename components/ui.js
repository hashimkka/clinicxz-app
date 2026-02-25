// components/ui.js
// Shared UI primitives
import React from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    ActivityIndicator, Switch,
} from 'react-native';
import { COLORS, SPACING, RADIUS } from '../constants/theme';

// ─── Card ────────────────────────────────────────────────────────────────────
export function Card({ children, style }) {
    return (
        <View style={[styles.card, style]}>
            {children}
        </View>
    );
}

// ─── SectionTitle ────────────────────────────────────────────────────────────
export function SectionTitle({ children }) {
    return <Text style={styles.sectionTitle}>{children}</Text>;
}

// ─── Label ───────────────────────────────────────────────────────────────────
export function Label({ children, required }) {
    return (
        <Text style={styles.label}>
            {children}{required ? <Text style={{ color: COLORS.error }}> *</Text> : null}
        </Text>
    );
}

// ─── FormInput ───────────────────────────────────────────────────────────────
export function FormInput({ label, required, multiline, numberOfLines = 4, style, ...props }) {
    return (
        <View style={[styles.inputGroup, style]}>
            {label ? <Label required={required}>{label}</Label> : null}
            <TextInput
                style={[styles.input, multiline && { height: numberOfLines * 40, textAlignVertical: 'top' }]}
                placeholderTextColor={COLORS.textDim}
                multiline={multiline}
                numberOfLines={multiline ? numberOfLines : 1}
                {...props}
            />
        </View>
    );
}

// ─── PrimaryButton ───────────────────────────────────────────────────────────
export function PrimaryButton({ title, onPress, loading, style, small }) {
    return (
        <TouchableOpacity
            style={[styles.primaryBtn, small && styles.primaryBtnSmall, style]}
            onPress={onPress}
            activeOpacity={0.8}
            disabled={loading}
        >
            {loading
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={[styles.primaryBtnText, small && { fontSize: 13 }]}>{title}</Text>
            }
        </TouchableOpacity>
    );
}

// ─── SecondaryButton ─────────────────────────────────────────────────────────
export function SecondaryButton({ title, onPress, style, small, danger }) {
    return (
        <TouchableOpacity
            style={[styles.secondaryBtn, danger && styles.dangerBtn, small && styles.secondaryBtnSmall, style]}
            onPress={onPress}
            activeOpacity={0.8}
        >
            <Text style={[styles.secondaryBtnText, danger && { color: COLORS.dangerLight }, small && { fontSize: 13 }]}>
                {title}
            </Text>
        </TouchableOpacity>
    );
}

// ─── CheckRow ────────────────────────────────────────────────────────────────
export function CheckRow({ label, value, onChange }) {
    return (
        <TouchableOpacity
            style={styles.checkRow}
            onPress={() => onChange(!value)}
            activeOpacity={0.7}
        >
            <View style={[styles.checkbox, value && styles.checkboxChecked]}>
                {value ? <Text style={styles.checkmark}>✓</Text> : null}
            </View>
            <Text style={styles.checkLabel}>{label}</Text>
        </TouchableOpacity>
    );
}

// ─── ToggleRow ───────────────────────────────────────────────────────────────
export function ToggleRow({ label, value, onChange }) {
    return (
        <View style={styles.toggleRow}>
            <Text style={styles.checkLabel}>{label}</Text>
            <Switch
                value={!!value}
                onValueChange={onChange}
                trackColor={{ false: COLORS.border, true: COLORS.primary }}
                thumbColor={value ? COLORS.primaryLight : COLORS.textMuted}
            />
        </View>
    );
}

// ─── SelectInput ─────────────────────────────────────────────────────────────
export function SelectPicker({ label, value, options, onChange }) {
    return (
        <View style={styles.inputGroup}>
            {label ? <Label>{label}</Label> : null}
            <View style={styles.selectRow}>
                {options.map(opt => (
                    <TouchableOpacity
                        key={opt.value}
                        style={[styles.selectChip, value === opt.value && styles.selectChipActive]}
                        onPress={() => onChange(opt.value)}
                    >
                        <Text style={[styles.selectChipText, value === opt.value && styles.selectChipTextActive]}>
                            {opt.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );
}

// ─── ProgressBar ─────────────────────────────────────────────────────────────
export function ProgressBar({ percent, label, color }) {
    const pct = Math.min(100, Math.max(0, percent || 0));
    return (
        <View style={styles.pbWrap}>
            {label ? (
                <View style={styles.pbHeader}>
                    <Text style={styles.pbLabel}>{label}</Text>
                    <Text style={styles.pbPct}>{pct}%</Text>
                </View>
            ) : null}
            <View style={styles.pbTrack}>
                <View style={[styles.pbFill, { width: `${pct}%`, backgroundColor: color || COLORS.primary }]} />
            </View>
        </View>
    );
}

// ─── EmptyState ──────────────────────────────────────────────────────────────
export function EmptyState({ message }) {
    return (
        <View style={styles.empty}>
            <Text style={styles.emptyText}>{message}</Text>
        </View>
    );
}

// ─── Divider ─────────────────────────────────────────────────────────────────
export function Divider({ style }) {
    return <View style={[styles.divider, style]} />;
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.lg,
        borderWidth: 1,
        borderColor: COLORS.border,
        padding: SPACING.lg,
        marginBottom: SPACING.md,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.white,
        marginBottom: SPACING.md,
        paddingBottom: SPACING.sm,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    label: {
        fontSize: 13,
        fontWeight: '500',
        color: COLORS.textMuted,
        marginBottom: 6,
    },
    inputGroup: {
        marginBottom: SPACING.md,
    },
    input: {
        backgroundColor: COLORS.bg,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: RADIUS.md,
        paddingHorizontal: SPACING.md,
        paddingVertical: 12,
        color: COLORS.text,
        fontSize: 15,
    },
    primaryBtn: {
        backgroundColor: COLORS.primary,
        borderRadius: RADIUS.md,
        paddingVertical: 14,
        paddingHorizontal: SPACING.xl,
        alignItems: 'center',
        justifyContent: 'center',
    },
    primaryBtnSmall: {
        paddingVertical: 8,
        paddingHorizontal: SPACING.md,
        borderRadius: RADIUS.sm,
    },
    primaryBtnText: {
        color: COLORS.white,
        fontWeight: '700',
        fontSize: 15,
    },
    secondaryBtn: {
        backgroundColor: COLORS.surfaceHover,
        borderRadius: RADIUS.md,
        paddingVertical: 14,
        paddingHorizontal: SPACING.xl,
        alignItems: 'center',
        justifyContent: 'center',
    },
    dangerBtn: {
        backgroundColor: '#450a0a',
        borderWidth: 1,
        borderColor: COLORS.danger,
    },
    secondaryBtnSmall: {
        paddingVertical: 8,
        paddingHorizontal: SPACING.md,
        borderRadius: RADIUS.sm,
    },
    secondaryBtnText: {
        color: COLORS.text,
        fontWeight: '600',
        fontSize: 15,
    },
    checkRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
        marginBottom: SPACING.sm,
    },
    checkbox: {
        width: 20,
        height: 20,
        borderRadius: 4,
        borderWidth: 2,
        borderColor: COLORS.borderLight,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.bg,
    },
    checkboxChecked: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    checkmark: {
        color: COLORS.white,
        fontSize: 12,
        fontWeight: '700',
    },
    checkLabel: {
        color: COLORS.text,
        fontSize: 14,
        flex: 1,
    },
    toggleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: SPACING.sm,
    },
    selectRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: SPACING.sm,
    },
    selectChip: {
        paddingVertical: 8,
        paddingHorizontal: SPACING.md,
        borderRadius: RADIUS.xl,
        borderWidth: 1,
        borderColor: COLORS.border,
        backgroundColor: COLORS.bg,
    },
    selectChipActive: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    selectChipText: {
        color: COLORS.textMuted,
        fontSize: 13,
        fontWeight: '600',
    },
    selectChipTextActive: {
        color: COLORS.white,
    },
    pbWrap: { marginBottom: SPACING.sm },
    pbHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    pbLabel: { color: COLORS.text, fontSize: 13 },
    pbPct: { color: COLORS.primaryLight, fontSize: 13, fontWeight: '700' },
    pbTrack: {
        height: 8,
        backgroundColor: COLORS.surfaceHover,
        borderRadius: 4,
        overflow: 'hidden',
    },
    pbFill: {
        height: 8,
        borderRadius: 4,
    },
    empty: {
        paddingVertical: SPACING.xl,
        alignItems: 'center',
    },
    emptyText: {
        color: COLORS.textDim,
        fontSize: 15,
    },
    divider: {
        height: 1,
        backgroundColor: COLORS.border,
        marginVertical: SPACING.md,
    },
});
