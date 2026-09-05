/** Content for the four party games. Kept apart from the components so the
 *  writing can be edited without touching any logic. */

/* ------------------------------------------------------------------ THE BOMB */
export const BOMB_CATEGORIES: string[] = [
  "Countries you could find on a map",
  "Reasons to leave a party early",
  "Things that are beige",
  "Words you cannot spell",
  "Excuses for being late",
  "Things in this room",
  "Bad names for a dog",
  "Jobs you would be terrible at",
  "Things that are worse when wet",
  "Reasons the wifi is down",
  "Things you would not eat for money",
  "Ways to end a conversation",
  "Fruit, but you have to be quick",
  "Things older than you",
  "Terrible superpowers",
  "Things in a bag",
  "Reasons to cancel plans",
  "Films you have pretended to see",
  "Things that make a noise",
  "Ways to lose a friend slowly",
  "Objects that should not float",
  "Things your mother says",
  "Words that sound rude but are not",
  "Something you can do with a spoon",
];

/* ------------------------------------------------------------------ PARANOIA */
export const PARANOIA_QUESTIONS: string[] = [
  "Who here would survive longest in a zoo?",
  "Who is most likely to become mildly famous?",
  "Who would you least want to be stuck in a lift with?",
  "Who here tells the best story that is definitely not true?",
  "Who would panic first in an emergency?",
  "Who is secretly the most competitive?",
  "Who here would you trust with your phone unlocked?",
  "Who is most likely to start a fight with a seagull?",
  "Who would be the worst person to share a tent with?",
  "Who here has the strangest search history?",
  "Who is most likely to get away with a crime?",
  "Who would cry first watching a film about a dog?",
  "Who here is the most convincing liar?",
  "Who would you pick to give your eulogy?",
  "Who is most likely to text the wrong person tonight?",
  "Who here peaked at school?",
  "Who would last longest without their phone?",
  "Who is the most likely to join a cult by accident?",
  "Who here would be the first to be voted off the island?",
  "Who gives the worst advice with the most confidence?",
  "Who is most likely to be secretly rich?",
  "Who here would you call at 3am?",
  "Who is the biggest hypocrite in this room?",
  "Who would you swap lives with for a week?",
];

/* ------------------------------------------------------------------ THE WHEEL */
export type Segment = { label: string; weight: number; tone: string };

export const WHEEL_SEGMENTS: Segment[] = [
  { label: "You drink", weight: 3, tone: "#c8342b" },
  { label: "Everyone drinks", weight: 2, tone: "#e8a317" },
  { label: "Pick someone", weight: 3, tone: "#4c9a56" },
  { label: "Nobody drinks", weight: 2, tone: "#8e876f" },
  { label: "Left neighbour", weight: 2, tone: "#c8342b" },
  { label: "Right neighbour", weight: 2, tone: "#e8a317" },
  { label: "Waterfall", weight: 1, tone: "#4a6fa5" },
  { label: "Make a rule", weight: 2, tone: "#4c9a56" },
  { label: "Truth", weight: 2, tone: "#8e5aa8" },
  { label: "Dare", weight: 2, tone: "#c8342b" },
  { label: "Immunity", weight: 1, tone: "#dcd6c4" },
  { label: "Spin again", weight: 1, tone: "#6b706a" },
];

export const WHEEL_NOTES: Record<string, string> = {
  "You drink": "No appeal. No context. Just you.",
  "Everyone drinks": "Democracy at last.",
  "Pick someone": "Choose carefully. They will remember.",
  "Nobody drinks": "The Ministry giveth.",
  "Left neighbour": "Nothing personal. It is geometry.",
  "Right neighbour": "The other one. Yes, them.",
  "Waterfall": "Everyone starts. Nobody stops until the person on their right stops.",
  "Make a rule": "It applies until the wheel says otherwise.",
  "Truth": "One question from the group. Answer honestly.",
  "Dare": "The group decides. You do it.",
  "Immunity": "Skip your next one. Keep this quiet.",
  "Spin again": "The wheel is not finished with you.",
};

/* ------------------------------------------------------------------ FREEZE */
export const FREEZE_TAUNTS: string[] = [
  "moved first",
  "flinched",
  "could not hold it",
  "blinked, basically",
  "has the stillness of a wasp",
  "was practically dancing",
];
