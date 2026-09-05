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
  konami:           { title: "THE OLD WAYS",          hint: "Gamers know a certain sequence." },
  soup:             { title: "61% SOUP",              hint: "Type what you are made of." },
  unscrewed:        { title: "LOAD BEARING",          hint: "Four screws. Three turns each." },
  longpress:        { title: "THE LONG PRESS",        hint: "Do not let go of the red one." },
  twentythree:      { title: "THE 23 ENIGMA",         hint: "Press it a specific number of times." },
  moodswing:        { title: "MOOD SWING",            hint: "Take the vibes all the way down, up, and down." },
  lonely:           { title: "STILL THERE?",          hint: "Leave the machine alone for a minute." },
  threethirtythree: { title: "THE WITCHING MINUTE",   hint: "Be here at 3:33." },
  palindrome:       { title: "PALINDROME",            hint: "Switches: 1 2 3 3 2 1." },
  rightclick:       { title: "UNAUTHORISED MENU",     hint: "Right-click the panel." },
  basement:         { title: "THE BASEMENT",          hint: "The building has a floor below the lobby." },
  persistence:      { title: "PERSISTENCE",           hint: "Chase the coward twenty times." },
  returned:         { title: "YOU CAME BACK",         hint: "Return on another day." },
  confess:          { title: "CONFESSION",            hint: "The console knows a command." },
  demolition:       { title: "DEMOLITION",            hint: "Destroy the machine five times." },
  allrooms:         { title: "THE FULL TOUR",         hint: "Visit every department." },
  form27b:          { title: "BUREAUCRAT",            hint: "Actually submit Form 27-B." },
  guestbook:        { title: "1997",                  hint: "Sign the guestbook in the archive." },
  chosen:           { title: "CHOSEN",                hint: "Let the chamber pick you." },
  nightshift:       { title: "NIGHT SHIFT",           hint: "Come here after midnight." },
  cardsharp:        { title: "CARD SHARP",            hint: "Seven correct guesses in a row." },
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
    return { ...s, title: "————", hint: "Not yet." };
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
