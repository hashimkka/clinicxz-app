// services/database.js
// SQLite service for ClinicXZ - table names match Python models for DB compatibility
import * as SQLite from 'expo-sqlite';

let db = null;

export async function getDb() {
    if (!db) {
        db = await SQLite.openDatabaseAsync('clinicxz.db');
    }
    return db;
}

export async function initDatabase() {
    const db = await getDb();

    await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      hashed_password TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS patients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      phone_number TEXT NOT NULL,
      age INTEGER,
      place TEXT,
      father_name TEXT,
      school_class_studied TEXT,
      madrasa_class_studied TEXT,
      is_married INTEGER DEFAULT 0,
      husband_name TEXT,
      husband_job TEXT,
      kids_count INTEGER DEFAULT 0,
      is_working INTEGER DEFAULT 0,
      has_siblings INTEGER DEFAULT 0,
      siblings_have_issues INTEGER DEFAULT 0,
      core_reason TEXT,
      when_it_started TEXT,
      previously_sought_help TEXT DEFAULT '[]',
      previously_sought_help_other TEXT,
      medicine_status TEXT,
      other_medications TEXT,
      other_diseases TEXT,
      is_genetic INTEGER DEFAULT 0,
      genetic_relative_name TEXT,
      job_field TEXT,
      psychologist_name TEXT,
      psychiatrist_name TEXT,
      spiritual_name TEXT,
      homeopathy_name TEXT,
      ayurveda_name TEXT,
      unani_name TEXT,
      years_on_medicine INTEGER,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS kids (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sex TEXT,
      age INTEGER,
      patient_id INTEGER NOT NULL,
      FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS core_issues (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER UNIQUE NOT NULL,
      is_about_belief INTEGER DEFAULT 0,
      belief_types TEXT DEFAULT '[]',
      niyyath_related TEXT DEFAULT '[]',
      wudu_niyyath_time TEXT,
      namaz_niyyath_time TEXT,
      ghusl_niyyath_time TEXT,
      fasting_niyyath_time TEXT,
      najas_related TEXT DEFAULT '[]',
      urination_time TEXT,
      motion_time TEXT,
      ghusl_najas_time TEXT,
      normal_bath_time TEXT,
      hand_washing_time TEXT,
      dress_washing_time TEXT,
      dog_related INTEGER DEFAULT 0,
      pig_related INTEGER DEFAULT 0,
      over_soaping INTEGER DEFAULT 0,
      insects_related INTEGER DEFAULT 0,
      gas_locking_related INTEGER DEFAULT 0,
      fear_of_death INTEGER DEFAULT 0,
      fear_of_disease INTEGER DEFAULT 0,
      door_locking_related INTEGER DEFAULT 0,
      wudu_time TEXT,
      namaz_time TEXT,
      other_issues TEXT,
      FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      date TEXT NOT NULL,
      log TEXT,
      progress_note TEXT,
      patient_id INTEGER NOT NULL,
      FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS tracked_issues (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      percentage_cured INTEGER DEFAULT 0,
      patient_id INTEGER NOT NULL,
      FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS schedule_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      time TEXT NOT NULL,
      status TEXT DEFAULT 'Scheduled'
    );
  `);

    // Insert default admin user if not exists
    const existing = await db.getFirstAsync('SELECT id FROM users WHERE username = ?', ['admin']);
    if (!existing) {
        await db.runAsync(
            'INSERT INTO users (username, hashed_password) VALUES (?, ?)',
            ['admin', 'admin123']
        );
    }
}

// ─── AUTH ────────────────────────────────────────────────────────────────────
export async function loginUser(username, password) {
    const db = await getDb();
    const user = await db.getFirstAsync(
        'SELECT * FROM users WHERE username = ? AND hashed_password = ?',
        [username, password]
    );
    return user || null;
}

// ─── PATIENTS ─────────────────────────────────────────────────────────────────
export async function getAllPatients() {
    const db = await getDb();
    return await db.getAllAsync(
        'SELECT id, full_name, phone_number, core_reason, created_at FROM patients ORDER BY created_at DESC'
    );
}

export async function getPatientById(id) {
    const db = await getDb();
    const patient = await db.getFirstAsync('SELECT * FROM patients WHERE id = ?', [id]);
    if (!patient) return null;

    // Parse JSON fields
    patient.previously_sought_help = tryParseJSON(patient.previously_sought_help, []);

    // Load kids
    patient.kids = await db.getAllAsync('SELECT * FROM kids WHERE patient_id = ?', [id]);

    // Load core issues
    let core = await db.getFirstAsync('SELECT * FROM core_issues WHERE patient_id = ?', [id]);
    if (core) {
        core.niyyath_related = tryParseJSON(core.niyyath_related, []);
        core.najas_related = tryParseJSON(core.najas_related, []);
        core.belief_types = tryParseJSON(core.belief_types, []);
        patient.core_issues = core;
    } else {
        patient.core_issues = defaultCoreIssues(id);
    }

    // Load sessions
    patient.sessions = await db.getAllAsync(
        'SELECT * FROM sessions WHERE patient_id = ? ORDER BY date DESC',
        [id]
    );

    // Load tracked issues
    patient.tracked_issues = await db.getAllAsync(
        'SELECT * FROM tracked_issues WHERE patient_id = ?',
        [id]
    );

    return patient;
}

export async function createPatient(data) {
    const db = await getDb();
    const result = await db.runAsync(
        `INSERT INTO patients (
      full_name, phone_number, age, place, father_name, school_class_studied, madrasa_class_studied,
      is_married, husband_name, husband_job, kids_count,
      core_reason, when_it_started, previously_sought_help, previously_sought_help_other,
      medicine_status, other_medications, other_diseases,
      job_field, psychologist_name, psychiatrist_name, spiritual_name,
      homeopathy_name, ayurveda_name, unani_name, years_on_medicine
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [
            data.full_name, data.phone_number, data.age || null, data.place || null,
            data.father_name || null, data.school_class_studied || null, data.madrasa_class_studied || null,
            data.is_married ? 1 : 0, data.husband_name || null, data.husband_job || null,
            data.kids_count || 0,
            data.core_reason || null, data.when_it_started || null,
            JSON.stringify(data.previously_sought_help || []),
            data.previously_sought_help_other || null,
            data.medicine_status || null, data.other_medications || null, data.other_diseases || null,
            data.job_field || null,
            data.psychologist_name || null, data.psychiatrist_name || null, data.spiritual_name || null,
            data.homeopathy_name || null, data.ayurveda_name || null, data.unani_name || null,
            data.years_on_medicine || null,
        ]
    );

    const patientId = result.lastInsertRowId;

    // Insert kids
    if (Array.isArray(data.kids) && data.kids.length > 0) {
        for (const kid of data.kids) {
            if (kid.sex || kid.age) {
                await db.runAsync(
                    'INSERT INTO kids (sex, age, patient_id) VALUES (?,?,?)',
                    [kid.sex || '', kid.age || null, patientId]
                );
            }
        }
    }

    // Create default core_issues row
    await db.runAsync(
        'INSERT INTO core_issues (patient_id) VALUES (?)',
        [patientId]
    );

    return patientId;
}

export async function updatePatient(id, data) {
    const db = await getDb();
    await db.runAsync(
        `UPDATE patients SET
      full_name=?, phone_number=?, age=?, place=?, father_name=?,
      school_class_studied=?, madrasa_class_studied=?,
      is_married=?, husband_name=?, husband_job=?, kids_count=?,
      core_reason=?, when_it_started=?, previously_sought_help=?, previously_sought_help_other=?,
      medicine_status=?, other_medications=?, other_diseases=?,
      job_field=?, psychologist_name=?, psychiatrist_name=?, spiritual_name=?,
      homeopathy_name=?, ayurveda_name=?, unani_name=?, years_on_medicine=?
    WHERE id=?`,
        [
            data.full_name, data.phone_number, data.age || null, data.place || null,
            data.father_name || null, data.school_class_studied || null, data.madrasa_class_studied || null,
            data.is_married ? 1 : 0, data.husband_name || null, data.husband_job || null,
            data.kids_count || 0,
            data.core_reason || null, data.when_it_started || null,
            JSON.stringify(data.previously_sought_help || []),
            data.previously_sought_help_other || null,
            data.medicine_status || null, data.other_medications || null, data.other_diseases || null,
            data.job_field || null,
            data.psychologist_name || null, data.psychiatrist_name || null, data.spiritual_name || null,
            data.homeopathy_name || null, data.ayurveda_name || null, data.unani_name || null,
            data.years_on_medicine || null,
            id,
        ]
    );

    // Sync kids
    await db.runAsync('DELETE FROM kids WHERE patient_id = ?', [id]);
    if (Array.isArray(data.kids) && data.kids.length > 0) {
        for (const kid of data.kids) {
            if (kid.sex || kid.age) {
                await db.runAsync(
                    'INSERT INTO kids (sex, age, patient_id) VALUES (?,?,?)',
                    [kid.sex || '', kid.age || null, id]
                );
            }
        }
    }
}

export async function deletePatient(id) {
    const db = await getDb();
    await db.runAsync('DELETE FROM patients WHERE id = ?', [id]);
}

// ─── CORE ISSUES ──────────────────────────────────────────────────────────────
export async function updateCoreIssues(patientId, data) {
    const db = await getDb();
    const existing = await db.getFirstAsync('SELECT id FROM core_issues WHERE patient_id = ?', [patientId]);
    if (existing) {
        await db.runAsync(
            `UPDATE core_issues SET
        is_about_belief=?, belief_types=?, niyyath_related=?,
        wudu_niyyath_time=?, namaz_niyyath_time=?, ghusl_niyyath_time=?, fasting_niyyath_time=?,
        najas_related=?,
        urination_time=?, motion_time=?, ghusl_najas_time=?,
        normal_bath_time=?, hand_washing_time=?, dress_washing_time=?,
        dog_related=?, pig_related=?, over_soaping=?,
        insects_related=?, gas_locking_related=?,
        fear_of_death=?, fear_of_disease=?, door_locking_related=?,
        wudu_time=?, namaz_time=?, other_issues=?
      WHERE patient_id=?`,
            [
                data.is_about_belief ? 1 : 0,
                JSON.stringify(data.belief_types || []),
                JSON.stringify(data.niyyath_related || []),
                data.wudu_niyyath_time || null,
                data.namaz_niyyath_time || null,
                data.ghusl_niyyath_time || null,
                data.fasting_niyyath_time || null,
                JSON.stringify(data.najas_related || []),
                data.urination_time || null,
                data.motion_time || null,
                data.ghusl_najas_time || null,
                data.normal_bath_time || null,
                data.hand_washing_time || null,
                data.dress_washing_time || null,
                data.dog_related ? 1 : 0,
                data.pig_related ? 1 : 0,
                data.over_soaping ? 1 : 0,
                data.insects_related ? 1 : 0,
                data.gas_locking_related ? 1 : 0,
                data.fear_of_death ? 1 : 0,
                data.fear_of_disease ? 1 : 0,
                data.door_locking_related ? 1 : 0,
                data.wudu_time || null,
                data.namaz_time || null,
                data.other_issues || null,
                patientId,
            ]
        );
    } else {
        await db.runAsync('INSERT INTO core_issues (patient_id) VALUES (?)', [patientId]);
        await updateCoreIssues(patientId, data);
    }
}

// ─── SESSIONS ─────────────────────────────────────────────────────────────────
export async function addSession(patientId, data) {
    const db = await getDb();
    const result = await db.runAsync(
        'INSERT INTO sessions (title, date, log, progress_note, patient_id) VALUES (?,?,?,?,?)',
        [data.title, data.date, data.log || '', data.progress_note || '', patientId]
    );
    return result.lastInsertRowId;
}

export async function updateSession(id, data) {
    const db = await getDb();
    await db.runAsync(
        'UPDATE sessions SET title=?, date=?, log=?, progress_note=? WHERE id=?',
        [data.title, data.date, data.log || '', data.progress_note || '', id]
    );
}

export async function deleteSession(id) {
    const db = await getDb();
    await db.runAsync('DELETE FROM sessions WHERE id = ?', [id]);
}

// ─── TRACKED ISSUES ───────────────────────────────────────────────────────────
export async function addTrackedIssue(patientId, data) {
    const db = await getDb();
    const result = await db.runAsync(
        'INSERT INTO tracked_issues (name, percentage_cured, patient_id) VALUES (?,?,?)',
        [data.name, data.percentage_cured || 0, patientId]
    );
    return result.lastInsertRowId;
}

export async function updateTrackedIssue(id, data) {
    const db = await getDb();
    await db.runAsync(
        'UPDATE tracked_issues SET name=?, percentage_cured=? WHERE id=?',
        [data.name, data.percentage_cured, id]
    );
}

export async function deleteTrackedIssue(id) {
    const db = await getDb();
    await db.runAsync('DELETE FROM tracked_issues WHERE id = ?', [id]);
}

// ─── SCHEDULE ─────────────────────────────────────────────────────────────────
export async function getSchedule() {
    const db = await getDb();
    return await db.getAllAsync('SELECT * FROM schedule_events ORDER BY time ASC');
}

export async function addScheduleEvent(data) {
    const db = await getDb();
    const result = await db.runAsync(
        'INSERT INTO schedule_events (title, time, status) VALUES (?,?,?)',
        [data.title, data.time, 'Scheduled']
    );
    return result.lastInsertRowId;
}

export async function updateScheduleStatus(id, status) {
    const db = await getDb();
    await db.runAsync('UPDATE schedule_events SET status=? WHERE id=?', [status, id]);
}

export async function deleteScheduleEvent(id) {
    const db = await getDb();
    await db.runAsync('DELETE FROM schedule_events WHERE id = ?', [id]);
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function tryParseJSON(val, fallback) {
    try { return JSON.parse(val) || fallback; } catch { return fallback; }
}

function defaultCoreIssues(patientId) {
    return {
        patient_id: patientId,
        is_about_belief: 0,
        belief_types: [],
        niyyath_related: [],
        wudu_niyyath_time: '',
        namaz_niyyath_time: '',
        ghusl_niyyath_time: '',
        fasting_niyyath_time: '',
        najas_related: [],
        urination_time: '',
        motion_time: '',
        ghusl_najas_time: '',
        normal_bath_time: '',
        hand_washing_time: '',
        dress_washing_time: '',
        dog_related: 0,
        pig_related: 0,
        over_soaping: 0,
        insects_related: 0,
        gas_locking_related: 0,
        fear_of_death: 0,
        fear_of_disease: 0,
        door_locking_related: 0,
        wudu_time: '',
        namaz_time: '',
        other_issues: '',
    };
}
