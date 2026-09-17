/**
 * The secrets engine.
 *
 * Discoveries persist in localStorage and are shared across every department,
 * so finding them all requires visiting every room in the building. The count
 * is shown to the viewer; the total never is. "3 / ??" is the whole point.
 */

export type SecretId =
  | "konami"
  | "soup"
  | "unscrewed"
  | "longpress"
  | "twentythree"
  | "moodswing"
  | "lonely"
  | "threethirtythree"
  | "palindrome"
  | "rightclick"
  | "basement"
  | "persistence"
  | "returned"
  | "confess"
  | "demolition"
  | "allrooms"
  | "form27b"
  | "guestbook"
  | "chosen"
  | "nightshift"
  | "cardsharp";

export const SECRETS: Record<SecretId, { title: string; hint: string }> = {
  konami:           { title: "វិធីបុរាណ",              hint: "អ្នកលេងហ្គេមដឹងលំដាប់ជាក់លាក់មួយ។" },
  soup:             { title: "៦១% ស៊ុប",               hint: "វាយបញ្ចូលអ្វីដែលអ្នកធ្វើពី។" },
  unscrewed:        { title: "ទ្រទ្រង់ទម្ងន់",          hint: "វីសបួន។ បង្វិលបីជុំម្នាក់។" },
  longpress:        { title: "ការសង្កត់យូរ",            hint: "កុំលែងប៊ូតុងក្រហម។" },
  twentythree:      { title: "អាថ៌កំបាំង ២៣",          hint: "ចុចវាឱ្យគ្រប់ចំនួនជាក់លាក់។" },
  moodswing:        { title: "អារម្មណ៍ប្រែប្រួល",       hint: "បង្វិលអារម្មណ៍ចុះ ឡើង រួចចុះវិញ។" },
  lonely:           { title: "នៅទីនោះទេ?",             hint: "ទុកម៉ាស៊ីនចោលមួយនាទី។" },
  threethirtythree: { title: "នាទីមន្តអាគម",            hint: "មកទីនេះនៅម៉ោង ៣:៣៣។" },
  palindrome:       { title: "ពាក្យបញ្ច្រាស",           hint: "កុងតាក់៖ ១ ២ ៣ ៣ ២ ១។" },
  rightclick:       { title: "ម៉ឺនុយគ្មានការអនុញ្ញាត",  hint: "ចុចខាងស្តាំលើផ្ទាំង។" },
  basement:         { title: "បន្ទប់ក្រោមដី",           hint: "អគារនេះមានជាន់មួយនៅក្រោមកន្លែងទទួលភ្ញៀវ។" },
  persistence:      { title: "ការតស៊ូ",                 hint: "ដេញតាមអ្នកកំសាកម្ភៃដង។" },
  returned:         { title: "អ្នកត្រឡប់មកវិញ",         hint: "ត្រឡប់មកវិញនៅថ្ងៃផ្សេង។" },
  confess:          { title: "ការសារភាព",               hint: "កុងសូលដឹងពាក្យបញ្ជាមួយ។" },
  demolition:       { title: "ការបំផ្លាញ",              hint: "បំផ្លាញម៉ាស៊ីនប្រាំដង។" },
  allrooms:         { title: "ទស្សនកិច្ចពេញលេញ",        hint: "ទៅលេងគ្រប់នាយកដ្ឋាន។" },
  form27b:          { title: "មន្ត្រីរាជការ",           hint: "ដាក់ស្នើទម្រង់ ២៧-ខ ពិតប្រាកដ។" },
  guestbook:        { title: "១៩៩៧",                   hint: "ចុះហត្ថលេខាក្នុងសៀវភៅភ្ញៀវនៅបណ្ណសារ។" },
  chosen:           { title: "ត្រូវបានជ្រើសរើស",        hint: "ទុកឱ្យបន្ទប់ជ្រើសរើសអ្នក។" },
  nightshift:       { title: "វេនយប់",                  hint: "មកទីនេះក្រោយកណ្តាលអធ្រាត្រ។" },
  cardsharp:        { title: "ជំនាញបៀ",                 hint: "ទាយត្រូវប្រាំពីរដងជាប់ៗគ្នា។" },
};

const KEY = "miw:secrets";
const VISIT_KEY = "miw:visits";
const DAY_KEY = "miw:lastday";

type Listener = (found: SecretId[], justFound?: SecretId) => void;
const listeners = new Set<Listener>();

function read(): SecretId[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function write(list: SecretId[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* private window, blocked storage: the game still works, it just forgets */
  }
}

export function found(): SecretId[] {
  return read();
}

export function has(id: SecretId): boolean {
  return read().includes(id);
}

export function discover(id: SecretId): boolean {
  const list = read();
  if (list.includes(id)) return false;
  list.push(id);
  write(list);
  listeners.forEach((l) => l(list, id));
  return true;
}

export function subscribe(l: Listener): () => void {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function total(): number {
  return Object.keys(SECRETS).length;
}

/** Hints unlock slowly: you only get to see clues for what you are close to. */
export function availableHints(): { id: SecretId; title: string; hint: string; got: boolean }[] {
  const got = read();
  const all = (Object.keys(SECRETS) as SecretId[]).map((id) => ({
    id,
    title: SECRETS[id].title,
    hint: SECRETS[id].hint,
    got: got.includes(id),
  }));
  // one unrevealed hint becomes visible for every two you have found
  const budget = Math.floor(got.length / 2) + 1;
  let spent = 0;
  return all.map((s) => {
    if (s.got) return s;
    if (spent < budget) {
      spent++;
      return s;
    }
    return { ...s, title: "————", hint: "មិនទាន់នៅឡើយ។" };
  });
}

/* ---------------------------------------------------------------- visits */

export const ROOMS = [
  "/", "/bomb", "/wheel", "/paranoia", "/freeze",
  "/cards", "/pick", "/drink", "/fun", "/bored", "/form", "/archive",
] as const;

export function recordVisit(path: string) {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(VISIT_KEY);
    const list: string[] = raw ? JSON.parse(raw) : [];
    if (!list.includes(path)) {
      list.push(path);
      localStorage.setItem(VISIT_KEY, JSON.stringify(list));
    }
    if (ROOMS.every((r) => list.includes(r))) discover("allrooms");
  } catch {
    /* ignore */
  }
}

export function visitedRooms(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(VISIT_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/** Called once per mount: awards the day-based and clock-based secrets. */
export function checkTimeSecrets() {
  if (typeof window === "undefined") return;
  const now = new Date();

  if (now.getHours() === 3 && now.getMinutes() === 33) discover("threethirtythree");
  if (now.getHours() >= 0 && now.getHours() < 5) discover("nightshift");

  try {
    const today = now.toISOString().slice(0, 10);
    const last = localStorage.getItem(DAY_KEY);
    if (last && last !== today) discover("returned");
    localStorage.setItem(DAY_KEY, today);
  } catch {
    /* ignore */
  }
}

export function resetEverything() {
  try {
    localStorage.removeItem(KEY);
    localStorage.removeItem(VISIT_KEY);
    localStorage.removeItem(DAY_KEY);
    localStorage.removeItem("miw:presses");
    localStorage.removeItem("miw:demolitions");
  } catch {
    /* ignore */
  }
}
