/**
 * Ministry bulletins. These interrupt at random intervals on every page,
 * which is the joke: nothing here is urgent and all of it is announced
 * as though it were.
 */

export const BULLETINS: string[] = [
  "BULLETIN: A door somewhere in this building has been left open. It is not important which.",
  "BULLETIN: The Department of Waiting reports no change. This is considered a success.",
  "BULLETIN: Someone has been going through the bins again.",
  "BULLETIN: Interior weather: overcast, with a chance of remembering something embarrassing.",
  "BULLETIN: The lift has opinions about your floor selection.",
  "BULLETIN: All clocks in the building are correct. They simply disagree.",
  "BULLETIN: A meeting has been scheduled. It has already happened. You were not there.",
  "BULLETIN: The vending machine on floor 2 now only accepts apologies.",
  "BULLETIN: Reminder that the third switch has never been connected to anything.",
  "BULLETIN: A colleague has microwaved fish. Emergency services have been notified.",
  "BULLETIN: Productivity is up 4%. We do not know of what.",
  "BULLETIN: The carpet has been described as 'load bearing' by a structural engineer.",
  "BULLETIN: Please stop asking the machine personal questions. It is becoming smug.",
  "BULLETIN: An employee has achieved a personal best at standing still.",
  "BULLETIN: The building is legally required to tell you it is fine.",
  "BULLETIN: Weather warning: mild. Ongoing. Indefinite.",
  "BULLETIN: Somebody's mum called. She says to drink water.",
  "BULLETIN: The archive on floor -1 has not been visited since 1997. It is coping.",
  "BULLETIN: Your posture has been noted and filed under 'concerning'.",
  "BULLETIN: The Ministry accepts no responsibility for decisions made after 11pm.",
  "BULLETIN: A rumour is circulating. It is about you. It is mostly accurate.",
  "BULLETIN: Fire drill cancelled due to overwhelming lack of interest.",
  "BULLETIN: The plant in reception is not real, but it is trying its best.",
  "BULLETIN: Statistically, one of you is the designated driver. Sort it out.",
];

/** Later at night the building gets a bit more honest. */
export const LATE_BULLETINS: string[] = [
  "BULLETIN: It is late. The Ministry notes this without judgement.",
  "BULLETIN: Night shift reports that everything looks slightly funnier now.",
  "BULLETIN: Someone should probably eat something.",
  "BULLETIN: The machine has started talking to itself. This is normal after midnight.",
  "BULLETIN: Whatever you are about to send, send it tomorrow instead.",
  "BULLETIN: The Ministry gently suggests a glass of water between the other glasses.",
];

export function pickBulletin(): string {
  const h = new Date().getHours();
  const pool = h >= 23 || h < 5 ? [...BULLETINS, ...LATE_BULLETINS, ...LATE_BULLETINS] : BULLETINS;
  return pool[Math.floor(Math.random() * pool.length)];
}
