import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function getDataPath() {
  const rel = process.env.JSON_DB_PATH || path.join(__dirname, '../../data/shc-data.json');
  return path.isAbsolute(rel) ? rel : path.join(process.cwd(), rel);
}

export function emptyStore() {
  return {
    users: [],
    doctor_profiles: [],
    patient_profiles: [],
    appointments: [],
    clinical_records: [],
    messages: [],
  };
}

function ensureShape(data) {
  const e = emptyStore();
  for (const k of Object.keys(e)) {
    if (!Array.isArray(data[k])) data[k] = [];
  }
  return data;
}

export function readFileSyncSafe(filePath) {
  if (!fs.existsSync(filePath)) return emptyStore();
  const raw = fs.readFileSync(filePath, 'utf8');
  try {
    return ensureShape(JSON.parse(raw));
  } catch {
    return emptyStore();
  }
}

function writeFileSyncAtomic(filePath, data) {
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
  const tmp = `${filePath}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf8');
  fs.renameSync(tmp, filePath);
}

let tail = Promise.resolve();

function enqueue(fn) {
  const job = tail.then(fn);
  tail = job.catch(() => {});
  return job;
}

/**
 * Solo lectura en la misma cola que las escrituras (evita lecturas obsoletas).
 * @template T
 * @param {(data: ReturnType<emptyStore>) => T | Promise<T>} reader
 */
export function readQueued(reader) {
  return enqueue(async () => reader(readFileSyncSafe(getDataPath())));
}

/**
 * @template T
 * @param {(data: ReturnType<emptyStore>) => T | Promise<T>} fn — modifica `data` in situ
 */
export function withStore(fn) {
  return enqueue(async () => {
    const filePath = getDataPath();
    const data = readFileSyncSafe(filePath);
    const result = await fn(data);
    writeFileSyncAtomic(filePath, data);
    return result;
  });
}

export function nextId(data) {
  const all = [
    ...data.users.map((u) => u.id),
    ...data.doctor_profiles.map((d) => d.user_id),
    ...data.patient_profiles.map((p) => p.user_id),
    ...data.appointments.map((a) => a.id),
    ...data.clinical_records.map((r) => r.id),
    ...data.messages.map((m) => m.id),
  ];
  return (all.length ? Math.max(...all) : 0) + 1;
}
