// app/add-patient.js
import React, { useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { createPatient } from '../services/database';
import {
    Card, SectionTitle, FormInput, PrimaryButton, SecondaryButton,
    CheckRow, SelectPicker, Divider, ToggleRow,
} from '../components/ui';
import { COLORS, SPACING, RADIUS } from '../constants/theme';

const MEDICINE_STATUS_OPTS = [
    { label: 'Never', value: '' },
    { label: 'Did Take', value: 'I did take medicine' },
    { label: 'Taking Now', value: 'I am taking medicine now' },
];

const PROVIDERS = [
    { key: 'psychologist', label: 'Psychologist', nameKey: 'psychologist_name' },
    { key: 'psychiatrist', label: 'Psychiatrist', nameKey: 'psychiatrist_name' },
    { key: 'spiritual', label: 'Spiritual', nameKey: 'spiritual_name' },
    { key: 'homeopathy', label: 'Homeopathy', nameKey: 'homeopathy_name' },
    { key: 'ayurveda', label: 'Ayurveda', nameKey: 'ayurveda_name' },
    { key: 'unani', label: 'Unani', nameKey: 'unani_name' },
];

// Provider names stored as JSON arrays internally
const providerNamesKey = (p) => p.nameKey + 's'; // e.g. psychologist_names

function emptyForm() {
    return {
        full_name: '', phone_number: '', age: '', place: '',
        father_name: '', school_class_studied: '', madrasa_class_studied: '',
        is_married: false, husband_name: '', husband_job: '',
        kids_count: 0, kids: [],
        job_field: '',
        core_reason: '', when_it_started: '',
        previously_sought_help: [],
        // Arrays for multiple names per provider
        psychologist_names: [''], psychiatrist_names: [''],
        spiritual_names: [''], homeopathy_names: [''],
        ayurveda_names: [''], unani_names: [''],
        previously_sought_help_other: '',
        years_on_medicine: '',
        medicine_status: '',
        other_diseases: '',
        other_medications: '',
    };
}

export default function AddPatientScreen() {
    const router = useRouter();
    const [form, setForm] = useState(emptyForm());
    const [saving, setSaving] = useState(false);

    const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

    const toggleHelp = (val) => {
        setForm(f => {
            const arr = [...(f.previously_sought_help || [])];
            if (arr.includes(val)) return { ...f, previously_sought_help: arr.filter(x => x !== val) };
            return { ...f, previously_sought_help: [...arr, val] };
        });
    };

    const updateKidsCount = (n) => {
        const count = Math.max(0, parseInt(n) || 0);
        const kids = [...form.kids];
        while (kids.length < count) kids.push({ sex: '', age: '' });
        setForm(f => ({ ...f, kids_count: count, kids: kids.slice(0, count) }));
    };

    const updateKid = (i, field, val) => {
        const kids = form.kids.map((k, idx) => idx === i ? { ...k, [field]: val } : k);
        setForm(f => ({ ...f, kids }));
    };

    const addProviderName = (p) => {
        const key = providerNamesKey(p);
        setForm(f => ({ ...f, [key]: [...(f[key] || ['']), ''] }));
    };
    const updateProviderName = (p, i, v) => {
        const key = providerNamesKey(p);
        setForm(f => {
            const arr = [...(f[key] || [''])];
            arr[i] = v;
            return { ...f, [key]: arr };
        });
    };
    const removeProviderName = (p, i) => {
        const key = providerNamesKey(p);
        setForm(f => {
            const arr = (f[key] || ['']).filter((_, idx) => idx !== i);
            return { ...f, [key]: arr.length ? arr : [''] };
        });
    };

    const handleSave = async () => {
        if (!form.full_name.trim()) {
            Alert.alert('Validation', 'Full Name is required.');
            return;
        }
        if (!form.phone_number.trim()) {
            Alert.alert('Validation', 'Phone Number is required.');
            return;
        }
        setSaving(true);
        try {
            // Flatten provider name arrays to JSON strings for DB storage
            const saveData = { ...form };
            PROVIDERS.forEach(p => {
                const key = providerNamesKey(p);
                saveData[p.nameKey] = JSON.stringify((form[key] || ['']).filter(n => n.trim()));
            });
            const patientId = await createPatient({
                ...saveData,
                age: form.age ? parseInt(form.age) : null,
                years_on_medicine: form.years_on_medicine ? parseInt(form.years_on_medicine) : null,
            });
            router.replace(`/patient/${patientId}`);
        } catch (e) {
            Alert.alert('Error', 'Failed to save patient: ' + e.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={{ flex: 1, backgroundColor: COLORS.bg }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <ScrollView contentContainerStyle={styles.content}>

                {/* ── Personal Information ── */}
                <Card>
                    <SectionTitle>Personal Information</SectionTitle>
                    <FormInput label="Full Name" required value={form.full_name}
                        onChangeText={v => set('full_name', v)} placeholder="Enter full name" />
                    <FormInput label="Phone Number" required value={form.phone_number}
                        onChangeText={v => set('phone_number', v)} keyboardType="phone-pad" placeholder="+91 9999999999" />
                    <View style={styles.row}>
                        <FormInput label="Age" value={form.age} onChangeText={v => set('age', v)}
                            keyboardType="numeric" style={{ flex: 1 }} placeholder="Age" />
                        <FormInput label="Place" value={form.place} onChangeText={v => set('place', v)}
                            style={{ flex: 2, marginLeft: SPACING.sm }} placeholder="City / Town" />
                    </View>
                    <FormInput label="Father's Name" value={form.father_name}
                        onChangeText={v => set('father_name', v)} placeholder="Father's name" />
                    <FormInput label="School Class Studied" value={form.school_class_studied}
                        onChangeText={v => set('school_class_studied', v)} placeholder="e.g., 10th" />
                    <FormInput label="Madrasa Class / Level" value={form.madrasa_class_studied}
                        onChangeText={v => set('madrasa_class_studied', v)} placeholder="e.g., Fadhil" />
                </Card>

                {/* ── Marital & Family ── */}
                <Card>
                    <SectionTitle>Marital & Family Status</SectionTitle>
                    <ToggleRow label="Is Married?" value={form.is_married} onChange={v => set('is_married', v)} />
                    {form.is_married ? (
                        <View style={styles.row}>
                            <FormInput label="Husband's Name" value={form.husband_name}
                                onChangeText={v => set('husband_name', v)} style={{ flex: 1 }} />
                            <FormInput label="Husband's Job" value={form.husband_job}
                                onChangeText={v => set('husband_job', v)} style={{ flex: 1, marginLeft: SPACING.sm }} />
                        </View>
                    ) : null}
                    <FormInput label="Number of Kids" value={String(form.kids_count || '')}
                        onChangeText={updateKidsCount} keyboardType="numeric" placeholder="0" />
                    {form.kids.map((kid, i) => (
                        <View key={i} style={styles.kidRow}>
                            <Text style={styles.kidLabel}>Kid {i + 1}</Text>
                            <View style={styles.kidFields}>
                                <SelectPicker
                                    value={kid.sex}
                                    options={[{ label: 'Male', value: 'Male' }, { label: 'Female', value: 'Female' }]}
                                    onChange={v => updateKid(i, 'sex', v)}
                                />
                                <FormInput value={kid.age} onChangeText={v => updateKid(i, 'age', v)}
                                    keyboardType="numeric" placeholder="Age" style={{ marginTop: SPACING.sm }} />
                            </View>
                        </View>
                    ))}
                </Card>

                {/* ── Clinical & Other Information ── */}
                <Card>
                    <SectionTitle>Clinical & Other Information</SectionTitle>

                    {/* Job Field — REPLACES is_working */}
                    <FormInput label="Which Job Field?" value={form.job_field}
                        onChangeText={v => set('job_field', v)}
                        placeholder="e.g., Teacher, Engineer, Business..." />

                    <FormInput label="Core Reason (e.g., OCD, Anxiety)" value={form.core_reason}
                        onChangeText={v => set('core_reason', v)} />
                    <FormInput label="When did it start?" value={form.when_it_started}
                        onChangeText={v => set('when_it_started', v)} placeholder="e.g., 2 years ago" />

                    {/* Previously sought help — multiple names per provider */}
                    <Text style={styles.groupLabel}>Previously sought help from?</Text>
                    {PROVIDERS.map(p => {
                        const namesKey = providerNamesKey(p);
                        const names = form[namesKey] || [''];
                        const checked = (form.previously_sought_help || []).includes(p.key);
                        return (
                            <View key={p.key} style={styles.providerRow}>
                                <CheckRow
                                    label={p.label}
                                    value={checked}
                                    onChange={() => toggleHelp(p.key)}
                                />
                                {checked && (
                                    <View style={styles.namesContainer}>
                                        {names.map((name, i) => (
                                            <View key={i} style={styles.nameRow}>
                                                <FormInput
                                                    value={name}
                                                    onChangeText={v => updateProviderName(p, i, v)}
                                                    placeholder={`${p.label} name ${i + 1}...`}
                                                    style={{ flex: 1 }}
                                                />
                                                {names.length > 1 && (
                                                    <TouchableOpacity
                                                        onPress={() => removeProviderName(p, i)}
                                                        style={styles.removeNameBtn}
                                                    >
                                                        <Ionicons name="close-circle" size={22} color={COLORS.error} />
                                                    </TouchableOpacity>
                                                )}
                                            </View>
                                        ))}
                                        <TouchableOpacity
                                            style={styles.addNameBtn}
                                            onPress={() => addProviderName(p)}
                                        >
                                            <Ionicons name="add-circle-outline" size={16} color={COLORS.primaryLight} />
                                            <Text style={styles.addNameText}>Add another name</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>
                        );
                    })}
                    <FormInput label="Other (specify)" value={form.previously_sought_help_other}
                        onChangeText={v => set('previously_sought_help_other', v)} placeholder="Any other..." />

                    <Divider />

                    {/* Medicine */}
                    <SelectPicker
                        label="Medicine Status"
                        value={form.medicine_status}
                        options={MEDICINE_STATUS_OPTS}
                        onChange={v => set('medicine_status', v)}
                    />
                    <FormInput label="How many years took medicine?" value={form.years_on_medicine}
                        onChangeText={v => set('years_on_medicine', v)}
                        keyboardType="numeric" placeholder="e.g., 2" />

                    {/* Other Diseases FIRST, then Other Medications */}
                    <FormInput label="Other Diseases" value={form.other_diseases}
                        onChangeText={v => set('other_diseases', v)}
                        placeholder="Any other diseases or conditions..." />
                    <FormInput label="Other Medications" value={form.other_medications}
                        onChangeText={v => set('other_medications', v)}
                        placeholder="Other medications taken..." />
                </Card>

                {/* ── Buttons ── */}
                <View style={styles.actions}>
                    <SecondaryButton title="Clear Form" onPress={() => setForm(emptyForm())} />
                    <PrimaryButton title="Add Patient" onPress={handleSave} loading={saving} style={{ flex: 1 }} />
                </View>

            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    content: { padding: SPACING.md, paddingBottom: SPACING.xxl },
    row: { flexDirection: 'row', gap: SPACING.sm },
    kidRow: {
        marginBottom: SPACING.md,
        padding: SPACING.md,
        backgroundColor: COLORS.bg,
        borderRadius: RADIUS.md,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    kidLabel: { color: COLORS.textMuted, fontWeight: '600', marginBottom: SPACING.sm },
    kidFields: { gap: SPACING.sm },
    groupLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: SPACING.sm,
        marginTop: SPACING.xs,
    },
    providerRow: { marginBottom: SPACING.sm },
    namesContainer: { marginLeft: 28, marginTop: 4, gap: SPACING.xs },
    nameRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
    removeNameBtn: { padding: 4, marginTop: 4 },
    addNameBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        paddingVertical: 6, marginTop: 2,
    },
    addNameText: { color: COLORS.primaryLight, fontSize: 12, fontWeight: '600' },
    actions: {
        flexDirection: 'row',
        gap: SPACING.sm,
        marginTop: SPACING.sm,
    },
});
