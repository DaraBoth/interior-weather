# Ministry of Interior Weather

A fake government building on the web. Every department is a page, every page is
a very serious machine that does something profoundly stupid, and roughly twenty
things are hidden where nobody told you to look.

Built for people who are having a good night and do not want to read anything.

## The building

| Route | Department | What happens |
|---|---|---|
| `/` | Lobby | The Feelings Machine. A red button that resents you, a lever that diagnoses you, a vibes slider that physically tilts the page. |
| `/bomb` | **The Bomb** | Pass-the-phone panic. A category, an accelerating fuse of random length, and whoever is holding it when it blows drinks. |
| `/wheel` | **The Wheel** | A canvas wheel with real momentum and a peg that clicks. Run the Ministry's twelve weighted outcomes, or type your own list of names and forfeits. |
| `/paranoia` | **Paranoia** | Read a question privately, whisper it, they answer out loud, then a coin decides whether the room ever learns what was asked. |
| `/freeze` | **Freeze** | Everyone poses. The camera measures who drifted most during the hold. That person loses. |
| `/cards` | **Higher or Lower** | Guess the next card. Dealt without replacement from a real shoe, with the exact odds printed, so counting actually pays. |
| `/pick` | **Selection Chamber** | Type a forfeit, open the camera, and the Ministry picks who does it. |
| `/drink` | Liquid Decisions | Rules nobody agreed to, never-have-I-ever, dares, and a Ministerial Override. |
| `/fun` | Recreation Wing | Whack-the-things, a hold-the-button endurance record, a reaction test that lies. |
| `/bored` | Department of Waiting | A progress bar that never finishes, a queue you never reach, a stillness contest. |
| `/form` | Form 27-B | Deliberately awful UI. Always completable. |
| `/archive` | The Archive | 1997. Marquee, visitor counter, guestbook, and the hint list. |
| `/basement` | — | Not in the nav. The machine tells you how to get there. |

### Which game for which moment

- **The Bomb** is the loudest and needs no setup. Start here.
- **Paranoia** needs no camera and produces the biggest reactions. Best when people have settled.
- **The Wheel** is for when nobody can decide anything.
- **Higher or Lower** is the slow one. Good for a table, and the only game here with real skill in it.
- **Freeze** and the **Selection Chamber** both use the camera, so run them back to back while the model is warm.

## The Selection Chamber, and your camera

This is the party game. Someone types a forfeit, everyone gets in frame, and the
chamber picks a victim with a suspenseful scan.

**Nothing leaves the device.** There is no upload, no recording, no canvas export
and no network call anywhere on that page. The stream stops when you close the
chamber or leave the route.

Detection has three tiers and falls through automatically:

1. **`window.FaceDetector`** — the Shape Detection API. Instant and free where it
   exists, but it is not a real standard: Safari and Firefox never shipped it and
   desktop Chrome usually lacks it. Treated as a lucky bonus, never the plan.
2. **MediaPipe BlazeFace** — a genuine model, works in every modern browser. Costs
   one ~2MB download of WASM plus weights on first use, cached by the browser
   afterwards. This is what actually runs for most people.
3. **Manual** — everyone taps their own face on screen. Needs no network at all,
   and is honestly the better option in a dark room full of people.

The camera needs HTTPS. That is automatic on Vercel, and `localhost` counts as
secure during development.

## Hidden things

There are twenty. The building never tells you the total, only how many you have
found, which is the entire point. The Archive on `/archive` reveals hints slowly:
one new clue for every two discoveries.

A few live outside the pages entirely: a keyboard sequence, a word you can type
anywhere, a command in the browser console, a right-click, being here at a certain
time, and coming back on a different day.

Progress is kept in `localStorage`, so it is per-device and survives closing the tab.
`machine.reset()` in the console wipes it.

## Running it

```bash
pnpm install
pnpm dev          # http://localhost:3000
pnpm build        # production build
```

Node 20+ required. Uses Next.js 16 App Router, React 19, TypeScript, and no UI
library — the industrial look is hand-written CSS in `app/globals.css`.

All audio is synthesised at runtime in `lib/audio.ts`. Nothing is downloaded, so
nothing can fail to load on bad party wifi and there is no loop seam to hear.

The face model is the one exception: it fetches WASM and weights from a CDN the
first time the chamber runs. If that fails, the chamber drops to manual mode
rather than breaking. Load it once on good wifi before the party and the browser
keeps it cached.

## Deploying to Vercel

The app is entirely static and client-side, so there is no configuration, no
environment variable and no server runtime to think about.

**From the dashboard**

1. Push this folder to a GitHub repo.
2. On vercel.com choose Add New → Project and import it.
3. Vercel detects Next.js on its own. Accept the defaults and deploy.

**From the terminal**

```bash
npx vercel          # preview deployment
npx vercel --prod   # production
```

Vercel serves everything over HTTPS by default, which is what the camera needs.

## Layout

```
app/
  layout.tsx        the building shell
  globals.css       the whole design system
  page.tsx          lobby, holds the most secrets
  bomb|wheel|paranoia|freeze/    the four party games
  pick|drink|fun|bored|form|archive|basement/
components/
  Ministry.tsx      nav, bulletins, discovery toast, cross-page secrets
lib/
  audio.ts          the synth
  secrets.ts        discovery engine and hint rationing
  bulletins.ts      the announcements that interrupt you
  faces.ts          three-tier face detection
  celebrate.ts      the stamp, flash and confetti shared by every verdict
  games.ts          categories, questions and wheel segments
```

## A note on the drinking

The forfeits are written to be silly rather than punishing, `/drink` forces a water
bulletin every seven rounds, and the Ministry gets gentler about it after 11pm.
Nobody is ever told to drink a specific amount by the machine — the players type
their own forfeit and can write whatever they like, including nothing.
