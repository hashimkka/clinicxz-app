// app/patient/[id].js — Patient Detail Screen with 4 tabs
import React, { useState, useCallback, useRef } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    Alert, Modal, TextInput, KeyboardAvoidingView, Platform,
    Animated,
} from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
    getPatientById, updatePatient, updateCoreIssues,
    addSession, updateSession, deleteSession,
    addTrackedIssue, updateTrackedIssue, deleteTrackedIssue,
} from '../../services/database';
import {
    Card, SectionTitle, FormInput, PrimaryButton, SecondaryButton,
    CheckRow, ProgressBar, EmptyState, Divider, ToggleRow, SelectPicker,
} from '../../components/ui';
import { COLORS, SPACING, RADIUS } from '../../constants/theme';

const TABS = ['Details', 'Checklist', 'Sessions', 'Progress'];

const PROVIDERS = [
    { key: 'psychologist', label: 'Psychologist', nameKey: 'psychologist_name' },
    { key: 'psychiatrist', label: 'Psychiatrist', nameKey: 'psychiatrist_name' },
    { key: 'spiritual', label: 'Spiritual', nameKey: 'spiritual_name' },
    { key: 'homeopathy', label: 'Homeopathy', nameKey: 'homeopathy_name' },
    { key: 'ayurveda', label: 'Ayurveda', nameKey: 'ayurveda_name' },
    { key: 'unani', label: 'Unani', nameKey: 'unani_name' },
];
const providerNamesKey = (p) => p.nameKey + 's'; // e.g. psychologist_names

const MEDICINE_STATUS_OPTS = [
    { label: 'Never', value: '' },
    { label: 'Did Take', value: 'I did take medicine' },
    { label: 'Taking Now', value: 'I am taking medicine now' },
];

const NIYYATH_ITEMS = [
    { val: 'Wudu', timeKey: 'wudu_niyyath_time', label: 'Wudu' },
    { val: 'Namaz', timeKey: 'namaz_niyyath_time', label: 'Namaz' },
    { val: 'Ghusl', timeKey: 'ghusl_niyyath_time', label: 'Ghusl' },
    { val: 'Fasting', timeKey: 'fasting_niyyath_time', label: 'Fasting' },
];

const NAJAS_ITEMS = [
    { val: 'Urination time', timeKey: 'urination_time' },
    { val: 'Motion time', timeKey: 'motion_time' },
    { val: 'Ghusl time', timeKey: 'ghusl_najas_time' },
    { val: 'Normal bath time', timeKey: 'normal_bath_time' },
    { val: 'Hand washing time', timeKey: 'hand_washing_time' },
    { val: 'Dress washing time', timeKey: 'dress_washing_time' },
];

export default function PatientDetailScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const [patient, setPatient] = useState(null);
    const [form, setForm] = useState(null);
    const [issues, setIssues] = useState(null);
    const [activeTab, setActiveTab] = useState('Details');
    const [savingDetails, setSavingDetails] = useState(false);
    const [savingIssues, setSavingIssues] = useState(false);
    const [sessionModal, setSessionModal] = useState({ show: false, mode: 'add', data: {} });
    const [trackForm, setTrackForm] = useState({ name: '', percentage_cured: 0 });

    useFocusEffect(
        useCallback(() => {
            loadPatient();
        }, [id])
    );

    const loadPatient = async () => {
        const data = await getPatientById(parseInt(id));
        if (data) {
            setPatient(data);
            const f = { ...data };
            f.previously_sought_help = Array.isArray(f.previously_sought_help) ? f.previously_sought_help : [];
            // Parse provider names from JSON strings to arrays
            PROVIDERS.forEach(p => {
                const stored = f[p.nameKey] || '';
                let arr;
                try { arr = JSON.parse(stored); } catch { arr = stored ? [stored] : []; }
                f[providerNamesKey(p)] = Array.isArray(arr) && arr.length ? arr : [''];
            });
            setForm(f);
            const ci = data.core_issues || {};
            if (!Array.isArray(ci.niyyath_related)) ci.niyyath_related = [];
            if (!Array.isArray(ci.najas_related)) ci.najas_related = [];
            // Normalize belief_types to array of {title, text} objects
            if (!Array.isArray(ci.belief_types)) ci.belief_types = [];
            ci.belief_types = ci.belief_types.map(b =>
                typeof b === 'object' && b !== null ? b : { title: '', text: String(b) }
            );
            setIssues({ ...ci });
        }
    };

    const avgProgress = () => {
        const tracked = patient?.tracked_issues || [];
        if (!tracked.length) return 0;
        return Math.round(tracked.reduce((s, t) => s + (t.percentage_cured || 0), 0) / tracked.length);
    };

    // ── Helpers ────────────────────────────────────────────────────────────────
    const setF = (key, val) => setForm(f => ({ ...f, [key]: val }));
    const setCI = (key, val) => setIssues(c => ({ ...c, [key]: val }));

    const toggleProvider = (key) => {
        setForm(f => {
            const arr = [...(f.previously_sought_help || [])];
            if (arr.includes(key)) return { ...f, previously_sought_help: arr.filter(x => x !== key) };
            return { ...f, previously_sought_help: [...arr, key] };
        });
    };

    const toggleNiyyath = (val) => {
        setIssues(c => {
            const arr = [...(c.niyyath_related || [])];
            if (arr.includes(val)) return { ...c, niyyath_related: arr.filter(x => x !== val) };
            return { ...c, niyyath_related: [...arr, val] };
        });
    };

    const toggleNajas = (val) => {
        setIssues(c => {
            const arr = [...(c.najas_related || [])];
            if (arr.includes(val)) return { ...c, najas_related: arr.filter(x => x !== val) };
            return { ...c, najas_related: [...arr, val] };
        });
    };

    const addBelief = () => setIssues(c => ({ ...c, belief_types: [...(c.belief_types || []), { title: '', text: '' }] }));
    const updateBelief = (i, field, v) => {
        const belief_types = [...(issues.belief_types || [])];
        belief_types[i] = { ...belief_types[i], [field]: v };
        setIssues(c => ({ ...c, belief_types }));
    };
    const removeBelief = (i) => {
        const belief_types = [...(issues.belief_types || [])].filter((_, idx) => idx !== i);
        setIssues(c => ({ ...c, belief_types }));
    };

    // Provider name helpers for DetailsTab
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

    // ── Save Details ──────────────────────────────────────────────────────────
    const saveDetails = async () => {
        setSavingDetails(true);
        try {
            // Flatten provider name arrays to JSON strings for DB
            const saveData = { ...form };
            PROVIDERS.forEach(p => {
                const key = providerNamesKey(p);
                saveData[p.nameKey] = JSON.stringify((form[key] || ['']).filter(n => n.trim()));
            });
            await updatePatient(parseInt(id), {
                ...saveData,
                age: form.age ? parseInt(form.age) : null,
                years_on_medicine: form.years_on_medicine ? parseInt(form.years_on_medicine) : null,
            });
            Alert.alert('Saved', 'Patient details updated!');
            loadPatient();
        } catch (e) {
            Alert.alert('Error', e.message);
        } finally {
            setSavingDetails(false);
        }
    };

    // ── Save Checklist ────────────────────────────────────────────────────────
    const saveChecklist = async () => {
        setSavingIssues(true);
        try {
            await updateCoreIssues(parseInt(id), issues);
            Alert.alert('Saved', 'Checklist saved!');
            loadPatient();
        } catch (e) {
            Alert.alert('Error', e.message);
        } finally {
            setSavingIssues(false);
        }
    };

    // ── Sessions ──────────────────────────────────────────────────────────────
    const openSession = (mode, session = null) => {
        setSessionModal({
            show: true, mode,
            data: mode === 'add'
                ? { title: '', date: new Date().toISOString().slice(0, 10), log: '', progress_note: '' }
                : { ...session },
        });
    };

    const saveSession = async () => {
        const d = sessionModal.data;
        if (!d.title?.trim() || !d.date?.trim()) {
            Alert.alert('Validation', 'Title and date are required.');
            return;
        }
        if (sessionModal.mode === 'add') {
            await addSession(parseInt(id), d);
        } else {
            await updateSession(d.id, d);
        }
        setSessionModal({ show: false, mode: 'add', data: {} });
        loadPatient();
    };

    const confirmDeleteSession = (sid) => {
        Alert.alert('Delete Session', 'Are you sure?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: async () => { await deleteSession(sid); loadPatient(); } },
        ]);
    };

    // ── Tracked Issues ────────────────────────────────────────────────────────
    const handleAddTracked = async () => {
        if (!trackForm.name.trim()) { Alert.alert('Error', 'Enter issue name.'); return; }
        await addTrackedIssue(parseInt(id), trackForm);
        setTrackForm({ name: '', percentage_cured: 0 });
        loadPatient();
    };

    const updatePct = async (issue, pct) => {
        const updated = { ...issue, percentage_cured: pct };
        await updateTrackedIssue(issue.id, updated);
        loadPatient();
    };

    const confirmDeleteTracked = (tid) => {
        Alert.alert('Delete', 'Remove this tracked issue?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: async () => { await deleteTrackedIssue(tid); loadPatient(); } },
        ]);
    };

    // ── Render ────────────────────────────────────────────────────────────────
    if (!patient || !form) {
        return <View style={styles.loading}><Text style={{ color: COLORS.textMuted }}>Loading…</Text></View>;
    }

    return (
        <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
            {/* Patient Header */}
            <View style={styles.patientHeader}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{(patient.full_name || '?').charAt(0).toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={styles.patientName}>{patient.full_name}</Text>
                    <Text style={styles.patientPhone}>{patient.phone_number}</Text>
                    {patient.core_reason ? (
                        <Text style={styles.patientReason}>{patient.core_reason}</Text>
                    ) : null}
                </View>
                <View style={styles.overallProgressWrap}>
                    <Text style={styles.overallPct}>{avgProgress()}%</Text>
                    <Text style={styles.overallLabel}>Progress</Text>
                </View>
            </View>

            {/* Tab Bar */}
            <View style={styles.tabBar}>
                {TABS.map(tab => (
                    <TouchableOpacity
                        key={tab}
                        style={[styles.tab, activeTab === tab && styles.tabActive]}
                        onPress={() => setActiveTab(tab)}
                    >
                        <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Tab Content */}
            {activeTab === 'Details' && (
                <DetailsTab form={form} setF={setF} toggleProvider={toggleProvider}
                    PROVIDERS={PROVIDERS}
                    addProviderName={addProviderName}
                    updateProviderName={updateProviderName}
                    removeProviderName={removeProviderName}
                    MEDICINE_STATUS_OPTS={MEDICINE_STATUS_OPTS}
                    saving={savingDetails} onSave={saveDetails} />
            )}
            {activeTab === 'Checklist' && (
                <ChecklistTab issues={issues} setCI={setCI}
                    toggleNiyyath={toggleNiyyath} toggleNajas={toggleNajas}
                    addBelief={addBelief} updateBelief={updateBelief} removeBelief={removeBelief}
                    saving={savingIssues} onSave={saveChecklist} />
            )}
            {activeTab === 'Sessions' && (
                <SessionsTab sessions={patient.sessions || []}
                    avgProgress={avgProgress()}
                    onAdd={() => openSession('add')}
                    onEdit={s => openSession('edit', s)}
                    onDelete={confirmDeleteSession} />
            )}
            {activeTab === 'Progress' && (
                <ProgressTab
                    trackedIssues={patient.tracked_issues || []}
                    trackForm={trackForm} setTrackForm={setTrackForm}
                    onAdd={handleAddTracked} onUpdatePct={updatePct} onDelete={confirmDeleteTracked}
                />
            )}

            {/* Session Modal */}
            <Modal visible={sessionModal.show} transparent animationType="slide">
                <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                    <View style={styles.overlay}>
                        <ScrollView style={styles.modal} keyboardShouldPersistTaps="handled">
                            <Text style={styles.modalTitle}>
                                {sessionModal.mode === 'add' ? 'Add Session' : 'Edit Session'}
                            </Text>
                            <Text style={styles.inputLabel}>Title</Text>
                            <TextInput
                                style={styles.modalInput}
                                value={sessionModal.data.title}
                                onChangeText={v => setSessionModal(m => ({ ...m, data: { ...m.data, title: v } }))}
                                placeholder="Session title"
                                placeholderTextColor={COLORS.textDim}
                            />
                            <Text style={styles.inputLabel}>Date</Text>
                            <TextInput
                                style={styles.modalInput}
                                value={sessionModal.data.date}
                                onChangeText={v => setSessionModal(m => ({ ...m, data: { ...m.data, date: v } }))}
                                placeholder="YYYY-MM-DD"
                                placeholderTextColor={COLORS.textDim}
                            />
                            <Text style={styles.inputLabel}>Session Log</Text>
                            <TextInput
                                style={[styles.modalInput, { height: 120, textAlignVertical: 'top' }]}
                                value={sessionModal.data.log}
                                onChangeText={v => setSessionModal(m => ({ ...m, data: { ...m.data, log: v } }))}
                                placeholder="What happened in this session..."
                                placeholderTextColor={COLORS.textDim}
                                multiline
                            />
                            <Text style={styles.inputLabel}>Progress Note</Text>
                            <TextInput
                                style={[styles.modalInput, { height: 80, textAlignVertical: 'top' }]}
                                value={sessionModal.data.progress_note}
                                onChangeText={v => setSessionModal(m => ({ ...m, data: { ...m.data, progress_note: v } }))}
                                placeholder="Note about patient's progress..."
                                placeholderTextColor={COLORS.textDim}
                                multiline
                            />
                            <View style={styles.modalBtns}>
                                <TouchableOpacity
                                    style={styles.cancelBtn}
                                    onPress={() => setSessionModal({ show: false, mode: 'add', data: {} })}
                                >
                                    <Text style={styles.cancelBtnText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.saveBtn} onPress={saveSession}>
                                    <Text style={styles.saveBtnText}>Save Session</Text>
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </View>
    );
}

// ═══ DETAILS TAB ══════════════════════════════════════════════════════════════
function DetailsTab({ form, setF, toggleProvider, PROVIDERS, addProviderName, updateProviderName, removeProviderName, MEDICINE_STATUS_OPTS, saving, onSave }) {
    const updateKidsCount = (n) => {
        const count = Math.max(0, parseInt(n) || 0);
        const kids = [...(form.kids || [])];
        while (kids.length < count) kids.push({ sex: '', age: '' });
        setF('kids_count', count);
        setF('kids', kids.slice(0, count));
    };

    return (
        <ScrollView contentContainerStyle={styles.tabContent}>
            {/* Personal */}
            <Card>
                <SectionTitle>Personal Information</SectionTitle>
                <View style={styles.row}>
                    <FormInput label="Full Name *" value={form.full_name}
                        onChangeText={v => setF('full_name', v)} style={{ flex: 2 }} />
                    <FormInput label="Age" value={String(form.age || '')}
                        onChangeText={v => setF('age', v)} keyboardType="numeric" style={{ flex: 1, marginLeft: SPACING.sm }} />
                </View>
                <FormInput label="Phone Number *" value={form.phone_number}
                    onChangeText={v => setF('phone_number', v)} keyboardType="phone-pad" />
                <FormInput label="Place" value={form.place || ''} onChangeText={v => setF('place', v)} />
                <FormInput label="Father's Name" value={form.father_name || ''} onChangeText={v => setF('father_name', v)} />
                <View style={styles.row}>
                    <FormInput label="School Class" value={form.school_class_studied || ''}
                        onChangeText={v => setF('school_class_studied', v)} style={{ flex: 1 }} />
                    <FormInput label="Madrasa Class" value={form.madrasa_class_studied || ''}
                        onChangeText={v => setF('madrasa_class_studied', v)} style={{ flex: 1, marginLeft: SPACING.sm }} />
                </View>
            </Card>

            {/* Marital */}
            <Card>
                <SectionTitle>Marital & Family</SectionTitle>
                <ToggleRow label="Is Married?" value={form.is_married} onChange={v => setF('is_married', v)} />
                {form.is_married ? (
                    <View style={styles.row}>
                        <FormInput label="Husband's Name" value={form.husband_name || ''}
                            onChangeText={v => setF('husband_name', v)} style={{ flex: 1 }} />
                        <FormInput label="Husband's Job" value={form.husband_job || ''}
                            onChangeText={v => setF('husband_job', v)} style={{ flex: 1, marginLeft: SPACING.sm }} />
                    </View>
                ) : null}
                <FormInput label="Number of Kids" value={String(form.kids_count || 0)}
                    onChangeText={updateKidsCount} keyboardType="numeric" />
                {(form.kids || []).map((kid, i) => (
                    <View key={i} style={styles.kidRow}>
                        <Text style={styles.kidLabel}>Kid {i + 1}</Text>
                        <SelectPicker value={kid.sex}
                            options={[{ label: 'Male', value: 'Male' }, { label: 'Female', value: 'Female' }]}
                            onChange={v => {
                                const kids = [...form.kids]; kids[i] = { ...kids[i], sex: v }; setF('kids', kids);
                            }} />
                        <FormInput value={String(kid.age || '')} onChangeText={v => {
                            const kids = [...form.kids]; kids[i] = { ...kids[i], age: v }; setF('kids', kids);
                        }} keyboardType="numeric" placeholder="Age" />
                    </View>
                ))}
            </Card>

            {/* Clinical */}
            <Card>
                <SectionTitle>Clinical & Other Information</SectionTitle>
                <FormInput label="Which Job Field?" value={form.job_field || ''}
                    onChangeText={v => setF('job_field', v)} placeholder="e.g., Teacher, Business..." />
                <FormInput label="Core Reason" value={form.core_reason || ''}
                    onChangeText={v => setF('core_reason', v)} placeholder="e.g., OCD, Anxiety" />
                <FormInput label="When did it start?" value={form.when_it_started || ''}
                    onChangeText={v => setF('when_it_started', v)} placeholder="e.g., 2 years ago" />

                <Text style={styles.groupLabel}>Previously sought help from?</Text>
                {PROVIDERS.map(p => {
                    const namesKey = providerNamesKey(p);
                    const names = form[namesKey] || [''];
                    const checked = (form.previously_sought_help || []).includes(p.key);
                    return (
                        <View key={p.key}>
                            <CheckRow
                                label={p.label}
                                value={checked}
                                onChange={() => toggleProvider(p.key)}
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
                <FormInput label="Other" value={form.previously_sought_help_other || ''}
                    onChangeText={v => setF('previously_sought_help_other', v)} placeholder="Other..." />

                <Divider />
                <SelectPicker label="Medicine Status" value={form.medicine_status || ''}
                    options={MEDICINE_STATUS_OPTS} onChange={v => setF('medicine_status', v)} />
                <FormInput label="How many years took medicine?" value={String(form.years_on_medicine || '')}
                    onChangeText={v => setF('years_on_medicine', v)} keyboardType="numeric" />
                <FormInput label="Other Diseases" value={form.other_diseases || ''}
                    onChangeText={v => setF('other_diseases', v)} multiline numberOfLines={3}
                    placeholder="Any other diseases..." />
                <FormInput label="Other Medications" value={form.other_medications || ''}
                    onChangeText={v => setF('other_medications', v)} multiline numberOfLines={3}
                    placeholder="Other medications..." />
            </Card>

            <PrimaryButton title="Save Changes" onPress={onSave} loading={saving} />
            <View style={{ height: SPACING.xxl }} />
        </ScrollView>
    );
}

// ═══ CHECKLIST TAB ════════════════════════════════════════════════════════════
function ChecklistTab({ issues, setCI, toggleNiyyath, toggleNajas, addBelief, updateBelief, removeBelief, saving, onSave }) {
    if (!issues) return <EmptyState message="Loading checklist..." />;
    return (
        <ScrollView contentContainerStyle={styles.tabContent}>

            {/* Core Issues */}
            <Card>
                <SectionTitle>Core Issues Checklist</SectionTitle>

                {/* Belief */}
                <CheckRow label="Is it about belief?"
                    value={!!issues.is_about_belief}
                    onChange={v => setCI('is_about_belief', v ? 1 : 0)} />
                {!!issues.is_about_belief && (
                    <View style={styles.beliefSection}>
                        <Text style={styles.subLabel}>Type of beliefs:</Text>
                        {(issues.belief_types || []).map((b, i) => (
                            <View key={i} style={styles.beliefEntry}>
                                <View style={styles.beliefEntryHeader}>
                                    <Text style={styles.beliefEntryNum}>Belief {i + 1}</Text>
                                    <TouchableOpacity onPress={() => removeBelief(i)} style={styles.removeBtn}>
                                        <Ionicons name="close-circle" size={20} color={COLORS.error} />
                                    </TouchableOpacity>
                                </View>
                                <TextInput
                                    style={styles.beliefInput}
                                    value={b.title || ''}
                                    onChangeText={v => updateBelief(i, 'title', v)}
                                    placeholder={`Title (e.g. Shirk, Jinn...)`}
                                    placeholderTextColor={COLORS.textDim}
                                />
                                <TextInput
                                    style={[styles.beliefInput, { marginTop: 6, minHeight: 60, textAlignVertical: 'top' }]}
                                    value={b.text || ''}
                                    onChangeText={v => updateBelief(i, 'text', v)}
                                    placeholder={`Description...`}
                                    placeholderTextColor={COLORS.textDim}
                                    multiline
                                />
                            </View>
                        ))}
                        <TouchableOpacity style={styles.addMoreBtn} onPress={addBelief}>
                            <Ionicons name="add-circle-outline" size={18} color={COLORS.primaryLight} />
                            <Text style={styles.addMoreText}>Add Belief</Text>
                        </TouchableOpacity>
                    </View>
                )}

                <Divider />

                {/* Niyyath */}
                <Text style={styles.groupLabel}>Niyyath (Intention) related:</Text>
                {NIYYATH_ITEMS.map(item => (
                    <View key={item.val} style={styles.timeItemWrap}>
                        <CheckRow
                            label={item.label}
                            value={(issues.niyyath_related || []).includes(item.val)}
                            onChange={() => toggleNiyyath(item.val)}
                        />
                        {(issues.niyyath_related || []).includes(item.val) && (
                            <TextInput
                                style={styles.timeInput}
                                value={issues[item.timeKey] || ''}
                                onChangeText={v => setCI(item.timeKey, v)}
                                placeholder="Time it takes (e.g. 30 mins)"
                                placeholderTextColor={COLORS.textDim}
                            />
                        )}
                    </View>
                ))}

                <Divider />

                {/* Najas */}
                <Text style={styles.groupLabel}>Najas (Impurity) related:</Text>
                {NAJAS_ITEMS.map(item => (
                    <View key={item.val} style={styles.timeItemWrap}>
                        <CheckRow
                            label={item.val}
                            value={(issues.najas_related || []).includes(item.val)}
                            onChange={() => toggleNajas(item.val)}
                        />
                        {(issues.najas_related || []).includes(item.val) && (
                            <TextInput
                                style={styles.timeInput}
                                value={issues[item.timeKey] || ''}
                                onChangeText={v => setCI(item.timeKey, v)}
                                placeholder="Time it takes (e.g. 15 mins)"
                                placeholderTextColor={COLORS.textDim}
                            />
                        )}
                    </View>
                ))}

                <Divider />

                {/* Object/Animal */}
                <Text style={styles.groupLabel}>Object / Animal related:</Text>
                <CheckRow label="Dog related" value={!!issues.dog_related} onChange={v => setCI('dog_related', v ? 1 : 0)} />
                <CheckRow label="Pig related" value={!!issues.pig_related} onChange={v => setCI('pig_related', v ? 1 : 0)} />
                <CheckRow label="Over-soaping" value={!!issues.over_soaping} onChange={v => setCI('over_soaping', v ? 1 : 0)} />
                <CheckRow label="Insects related" value={!!issues.insects_related} onChange={v => setCI('insects_related', v ? 1 : 0)} />
                <CheckRow label="Gas locking related" value={!!issues.gas_locking_related} onChange={v => setCI('gas_locking_related', v ? 1 : 0)} />

                <Divider />

                {/* Fear */}
                <Text style={styles.groupLabel}>Fear related:</Text>
                <CheckRow label="Fear of death" value={!!issues.fear_of_death} onChange={v => setCI('fear_of_death', v ? 1 : 0)} />
                <CheckRow label="Fear of disease" value={!!issues.fear_of_disease} onChange={v => setCI('fear_of_disease', v ? 1 : 0)} />
                <CheckRow label="Door locking related" value={!!issues.door_locking_related} onChange={v => setCI('door_locking_related', v ? 1 : 0)} />

                <Divider />

                {/* Other Issues */}
                <FormInput label="Other Issues" value={issues.other_issues || ''}
                    onChangeText={v => setCI('other_issues', v)} multiline numberOfLines={4}
                    placeholder="Describe any other issues..." />
            </Card>

            <PrimaryButton title="Save Checklist" onPress={onSave} loading={saving} />
            <View style={{ height: SPACING.xxl }} />
        </ScrollView>
    );
}

// ═══ SESSIONS TAB ═════════════════════════════════════════════════════════════
function SessionsTab({ sessions, avgProgress, onAdd, onEdit, onDelete }) {
    return (
        <View style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={styles.tabContent}>
                {sessions.length === 0 ? (
                    <EmptyState message="No sessions recorded. Add one!" />
                ) : (
                    sessions.map(s => (
                        <View key={s.id} style={styles.sessionCard}>
                            {/* Session header */}
                            <View style={styles.sessionHeader}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.sessionTitle}>{s.title}</Text>
                                    <Text style={styles.sessionDate}>{s.date}</Text>
                                </View>
                                <View style={styles.sessionActions}>
                                    <TouchableOpacity onPress={() => onEdit(s)} style={styles.editBtn}>
                                        <Ionicons name="pencil-outline" size={16} color={COLORS.primaryLight} />
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => onDelete(s.id)} style={styles.delBtn}>
                                        <Ionicons name="trash-outline" size={16} color={COLORS.error} />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Progress bar inside session */}
                            <View style={styles.sessionProgress}>
                                <ProgressBar
                                    percent={avgProgress}
                                    label="Overall Patient Progress"
                                    color={avgProgress >= 70 ? COLORS.success : avgProgress >= 40 ? COLORS.warning : COLORS.primary}
                                />
                            </View>

                            {/* Session log */}
                            {s.log ? <Text style={styles.sessionLog}>{s.log}</Text> : null}

                            {/* Progress note */}
                            {s.progress_note ? (
                                <View style={styles.progressNoteWrap}>
                                    <Ionicons name="trending-up-outline" size={14} color={COLORS.primaryLight} />
                                    <Text style={styles.progressNote}>{s.progress_note}</Text>
                                </View>
                            ) : null}
                        </View>
                    ))
                )}
                <View style={{ height: 80 }} />
            </ScrollView>

            {/* FAB */}
            <TouchableOpacity style={styles.fab} onPress={onAdd}>
                <Ionicons name="add" size={28} color="#fff" />
            </TouchableOpacity>
        </View>
    );
}

// ═══ PROGRESS TAB ═════════════════════════════════════════════════════════════
function ProgressTab({ trackedIssues, trackForm, setTrackForm, onAdd, onUpdatePct, onDelete }) {
    return (
        <ScrollView contentContainerStyle={styles.tabContent}>
            <Card>
                <SectionTitle>Progress Tracking</SectionTitle>

                {trackedIssues.length === 0 ? (
                    <EmptyState message="No issues tracked. Add one below." />
                ) : (
                    trackedIssues.map(issue => (
                        <View key={issue.id} style={styles.trackRow}>
                            <View style={{ flex: 1 }}>
                                <ProgressBar
                                    percent={issue.percentage_cured}
                                    label={issue.name}
                                    color={issue.percentage_cured >= 70 ? COLORS.success : issue.percentage_cured >= 40 ? COLORS.warning : COLORS.primary}
                                />
                            </View>
                            <View style={styles.trackControls}>
                                <TouchableOpacity
                                    style={styles.pctBtn}
                                    onPress={() => onUpdatePct(issue, Math.max(0, issue.percentage_cured - 5))}
                                >
                                    <Ionicons name="remove" size={16} color={COLORS.text} />
                                </TouchableOpacity>
                                <Text style={styles.pctNum}>{issue.percentage_cured}%</Text>
                                <TouchableOpacity
                                    style={styles.pctBtn}
                                    onPress={() => onUpdatePct(issue, Math.min(100, issue.percentage_cured + 5))}
                                >
                                    <Ionicons name="add" size={16} color={COLORS.text} />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => onDelete(issue.id)}>
                                    <Ionicons name="trash-outline" size={18} color={COLORS.error} />
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))
                )}

                <Divider />
                <Text style={styles.subLabel}>Add New Issue to Track</Text>
                <FormInput
                    label="Issue Name"
                    value={trackForm.name}
                    onChangeText={v => setTrackForm(f => ({ ...f, name: v }))}
                    placeholder="e.g., Reduce hand washing time"
                />
                <View style={styles.row}>
                    <FormInput
                        label="Initial %"
                        value={String(trackForm.percentage_cured)}
                        onChangeText={v => setTrackForm(f => ({ ...f, percentage_cured: parseInt(v) || 0 }))}
                        keyboardType="numeric"
                        style={{ flex: 1 }}
                    />
                    <View style={{ flex: 2, marginLeft: SPACING.sm, justifyContent: 'flex-end' }}>
                        <PrimaryButton title="Add Issue" onPress={onAdd} />
                    </View>
                </View>
            </Card>
            <View style={{ height: SPACING.xxl }} />
        </ScrollView>
    );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.bg },
    patientHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.md,
        padding: SPACING.md,
        backgroundColor: COLORS.surface,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    avatar: {
        width: 48, height: 48,
        borderRadius: 24,
        backgroundColor: COLORS.primary + '44',
        alignItems: 'center', justifyContent: 'center',
    },
    avatarText: { color: COLORS.primaryLight, fontWeight: '800', fontSize: 20 },
    patientName: { color: COLORS.white, fontWeight: '700', fontSize: 17 },
    patientPhone: { color: COLORS.textMuted, fontSize: 12, marginTop: 1 },
    patientReason: {
        color: COLORS.primaryLight, fontSize: 11, marginTop: 3,
        backgroundColor: COLORS.primary + '22',
        paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10,
        alignSelf: 'flex-start',
    },
    overallProgressWrap: { alignItems: 'center' },
    overallPct: { color: COLORS.primaryLight, fontWeight: '800', fontSize: 22 },
    overallLabel: { color: COLORS.textMuted, fontSize: 10, fontWeight: '600' },

    tabBar: {
        flexDirection: 'row',
        backgroundColor: COLORS.surface,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    tab: {
        flex: 1, paddingVertical: 12,
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    tabActive: { borderBottomColor: COLORS.primary },
    tabText: { color: COLORS.textMuted, fontSize: 13, fontWeight: '600' },
    tabTextActive: { color: COLORS.primaryLight },

    tabContent: { padding: SPACING.md, paddingBottom: SPACING.xxl },

    row: { flexDirection: 'row', gap: SPACING.sm },
    kidRow: {
        marginBottom: SPACING.md,
        padding: SPACING.md,
        backgroundColor: COLORS.bg,
        borderRadius: RADIUS.md,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    kidLabel: { color: COLORS.textMuted, fontWeight: '600', marginBottom: SPACING.sm, fontSize: 13 },
    groupLabel: {
        fontSize: 14, fontWeight: '700', color: COLORS.text,
        marginBottom: SPACING.sm, marginTop: SPACING.xs,
    },

    // Checklist
    beliefSection: {
        marginLeft: SPACING.lg, marginTop: SPACING.xs,
        marginBottom: SPACING.sm,
    },
    subLabel: { color: COLORS.textMuted, fontSize: 13, fontWeight: '500', marginBottom: SPACING.xs },
    beliefEntry: {
        marginBottom: SPACING.md,
        backgroundColor: COLORS.bg,
        borderRadius: RADIUS.md,
        borderWidth: 1,
        borderColor: COLORS.border,
        padding: SPACING.sm,
    },
    beliefEntryHeader: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: SPACING.xs,
    },
    beliefEntryNum: { color: COLORS.textMuted, fontSize: 12, fontWeight: '600' },
    beliefRow: {
        flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
        marginBottom: SPACING.sm,
    },
    beliefInput: {
        backgroundColor: COLORS.bg,
        borderWidth: 1, borderColor: COLORS.border,
        borderRadius: RADIUS.sm,
        paddingHorizontal: SPACING.sm,
        paddingVertical: 8,
        color: COLORS.text, fontSize: 14,
    },
    removeBtn: { padding: 2 },
    addMoreBtn: {
        flexDirection: 'row', alignItems: 'center', gap: SPACING.xs,
        paddingVertical: SPACING.sm,
    },
    addMoreText: { color: COLORS.primaryLight, fontWeight: '600', fontSize: 13 },
    timeItemWrap: { marginBottom: SPACING.xs },
    timeInput: {
        marginLeft: 28,
        backgroundColor: COLORS.bg,
        borderWidth: 1, borderColor: COLORS.border,
        borderRadius: RADIUS.sm,
        paddingHorizontal: SPACING.md,
        paddingVertical: 8,
        color: COLORS.text, fontSize: 14,
        marginTop: 4, marginBottom: SPACING.sm,
    },
    // Provider multiple names
    namesContainer: { marginLeft: 28, marginTop: 4, gap: SPACING.xs },
    nameRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
    removeNameBtn: { padding: 4, marginTop: 4 },
    addNameBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 6, marginTop: 2 },
    addNameText: { color: COLORS.primaryLight, fontSize: 12, fontWeight: '600' },

    // Sessions
    sessionCard: {
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.lg,
        borderWidth: 1,
        borderColor: COLORS.border,
        padding: SPACING.md,
        marginBottom: SPACING.md,
    },
    sessionHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: SPACING.sm },
    sessionTitle: { color: COLORS.white, fontWeight: '700', fontSize: 15 },
    sessionDate: { color: COLORS.textMuted, fontSize: 12, marginTop: 2 },
    sessionActions: { flexDirection: 'row', gap: SPACING.sm },
    editBtn: {
        padding: 6, backgroundColor: COLORS.primary + '22',
        borderRadius: RADIUS.sm,
    },
    delBtn: {
        padding: 6, backgroundColor: COLORS.error + '22',
        borderRadius: RADIUS.sm,
    },
    sessionProgress: { marginBottom: SPACING.sm },
    sessionLog: { color: COLORS.text, fontSize: 14, lineHeight: 20, marginTop: SPACING.xs },
    progressNoteWrap: {
        flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.xs,
        marginTop: SPACING.sm, padding: SPACING.sm,
        backgroundColor: COLORS.primary + '15',
        borderRadius: RADIUS.sm,
        borderLeftWidth: 3, borderLeftColor: COLORS.primary,
    },
    progressNote: { flex: 1, color: COLORS.textMuted, fontSize: 13, fontStyle: 'italic' },

    // Progress tab
    trackRow: {
        flexDirection: 'row', alignItems: 'center',
        marginBottom: SPACING.md, gap: SPACING.sm,
    },
    trackControls: {
        flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    },
    pctBtn: {
        width: 28, height: 28,
        borderRadius: 14,
        backgroundColor: COLORS.surfaceHover,
        alignItems: 'center', justifyContent: 'center',
    },
    pctNum: { color: COLORS.white, fontWeight: '700', fontSize: 14, minWidth: 40, textAlign: 'center' },

    fab: {
        position: 'absolute', bottom: SPACING.xl, right: SPACING.xl,
        width: 56, height: 56, borderRadius: 28,
        backgroundColor: COLORS.primary,
        alignItems: 'center', justifyContent: 'center',
        elevation: 8,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4, shadowRadius: 12,
    },

    // Modal
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' },
    modal: {
        backgroundColor: COLORS.surface,
        borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl,
        padding: SPACING.xl,
        maxHeight: '90%',
        borderTopWidth: 1, borderColor: COLORS.border,
    },
    modalTitle: { fontSize: 20, fontWeight: '700', color: COLORS.white, marginBottom: SPACING.lg },
    inputLabel: { color: COLORS.textMuted, fontSize: 13, fontWeight: '500', marginBottom: 6 },
    modalInput: {
        backgroundColor: COLORS.bg,
        borderWidth: 1, borderColor: COLORS.border,
        borderRadius: RADIUS.md,
        paddingHorizontal: SPACING.md, paddingVertical: 12,
        color: COLORS.text, fontSize: 15,
        marginBottom: SPACING.md,
    },
    modalBtns: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.sm, paddingBottom: SPACING.xl },
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
