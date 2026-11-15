<!-- File: README.md
  Owner: Person C (Yochan)
  Merge (update): Claude, 2026-11-15 - ported the pre-launch terminal countdown from the secondday branch into main; kept main's responsive layout, flight menu and Developer Mode. Reviewed by a human: NO (pending review by Person C, Yochan).
  AI-assisted: YES — Claude, 2026-11-15 (Developer Mode section and audio notes). Reviewed by a human: YES, Person C (Yochan).
  AI-assisted (update): ChatGPT, 2026-11-15 - reconciled source-backed data and policies, updated project structure, test results, credits and AI disclosure. Reviewed by a human: YES, Person C (Yochan).
  Sources used: NASA Planetary Fact Sheets, NASA CubeSat 101, Wessen et al. (2013), NASA DONKI and the project references listed below
-->

# APOGEE — Space Mission Design Game

> **Every kilogram is a decision.**

APOGEE is a browser game where you design a complete space mission: pick a destination, build a spacecraft part by part, choose an engine and a launch vehicle, fly the launch, and read a debrief that explains *why* you succeeded or failed. Mass, power, budget, data, communications and time all pull against each other, and there is rarely one perfect answer.

It was built for the **NASA Space Apps Challenge 2026** (challenge: *Space Mission Design Game*). It is plain HTML, CSS and vanilla JavaScript (native ES6 modules). There is no framework, no npm and no build step.

**Live game:** https://apogee-alpha-tawny.vercel.app/
**Team:** Person A — Asmin (engine, NASA data layer) · Person B — Saurav (UI, entry, styles) · Person C — Yochan (content, data values, docs)

---

## Table of contents

1. [How to play in 3 steps](#how-to-play-in-3-steps)
2. [Game features](#game-features)
3. [Run it locally](#run-it-locally)
4. [How the simulation works](#how-the-simulation-works)
5. [Career mode and destinations](#career-mode-and-destinations)
6. [Flight view and manual burns](#flight-view-and-manual-burns)
7. [Developer Mode (testing shortcut)](#developer-mode-testing-shortcut)
8. [Project structure](#project-structure)
9. [Data honesty: what is real and what is simplified](#data-honesty-what-is-real-and-what-is-simplified)
10. [NASA resources used](#nasa-resources-used)
11. [References and credits](#references-and-credits)
12. [AI use disclosure](#ai-use-disclosure)
13. [Accessibility and technical limits](#accessibility-and-technical-limits)

---

## How to play in 3 steps

Judges and first-time players: on the title screen, press **Quick Demo (Passing)** to see a working design, or **Try a Failing Design** to see how the debrief explains a failure. Otherwise:

1. **Choose an objective (Stage 1).** Pick a destination contract and an orbit. Each destination has its own science target, budget cap, distance, sunlight and radiation. Read the planet briefing to learn what you are up against.
2. **Build your spacecraft (Stage 2).** Drag parts onto the build canvas: bus, fuel tanks, engine, solar wings, batteries, antennas, data recorders and science instruments. Parts snap to attachment nodes. Choose a launch vehicle. Watch the live resource meters and engineering alerts, and fix anything marked **critical** or **thin margin**.
3. **Launch and read the debrief (Stages 3 and 4).** Watch the flight on the canvas and optionally fly two burns by hand for a small science bonus. The debrief shows your outcome, stars, score, and the reasons behind the result, with what to change next. Edit your design and launch again; nothing needs a reload.

Press **How to play** in the header at any time for the in-game guide.

---

## Game features

- **Four stages:** Objective → Build → Launch → Debrief.
- **Drag-and-snap spacecraft builder** with attachment nodes, mirror placement, undo, up to 40 parts per craft.
- **Live engineering dashboard** with margins and alerts (critical and thin-margin) for mass, delta-v, power, battery, comms, data storage, budget and time.
- **Three engine types:** chemical, nuclear thermal and ion. Each has real trade-offs (ion needs 1500 W of power and takes months; nuclear is efficient but heavy and costly).
- **Three launchers:** medium, heavy and super-heavy.
- **Ten destinations** in a career chain, from Earth orbit out to Neptune, plus the Sun, which physics will not let you reach.
- **Career mode** with ranks, 14 achievements and progress saved in the browser.
- **Save, load and compare builds,** plus a **Share / Load code** to copy a design as a text code.
- **Live space weather** from NASA DONKI feeds a radiation multiplier, with an offline fallback (see [NASA resources used](#nasa-resources-used)).
- **Optional manual burns** during the flight for up to +6% science.
- **Terminal countdown** from T-10 to lift-off, with its own sound and a status line at each step. Pause, Resume and Skip work during the countdown.
- **Audio:** per-stage music with a master volume and a mute button. Nothing plays until the player interacts with the page.
- **Reduced-motion support:** the background video is removed and animations shorten.

---

## Run it locally

APOGEE uses native ES6 modules, so browsers block it when opened with a double-click (`file://`). Use any static server from the project root:

```bash
# Option 1: Python
python3 -m http.server 8000
# then open http://localhost:8000

# Option 2: VS Code
# Install "Live Server", right-click index.html -> "Open with Live Server"
```

It is a static site, so it also runs as-is on **GitHub Pages**. All paths are relative.

No API keys or accounts are needed. The only external request is the optional NASA DONKI fetch, which uses NASA's public `DEMO_KEY`. If that request fails or is blocked, the game runs on offline sample values and labels them as such.

---

## How the simulation works

The simulation is **deterministic**: the same design and the same manual-burn precision always give the same result, using a seeded random number generator (`createSeededRng`, default seed `20261115`).

### What the engine checks

`calculateTelemetry()` in `js/core/engine.js` computes a table of resources and margins from your design:

| Resource | What it tracks |
|---|---|
| **Mass** | Spacecraft wet mass against the launcher's capacity for the chosen orbit |
| **Delta-v** | Propellant velocity change (rocket equation) against what the trip needs |
| **Power / Battery** | Solar or radioisotope generation against use, and battery cover during eclipse |
| **Comms / Data storage** | Antenna downlink and recorder capacity against the data your instruments generate |
| **Budget** | Total cost against the contract's cap |
| **Time** | Transit time and design life against the mission schedule |

**Margin convention (a project decision):** `margin % = (capacity − predicted use) ÷ predicted use × 100`. NASA programs define reserves in several ways, so this is our convention, not "the" NASA formula.

### Margin policies

| Policy | Margin | Source |
|---|---|---|
| Easy | 10% | NASA CubeSat 101 (p. 13): recommends a budget reserve of at least 10% for unexpected events |
| Hard ("by the book") | 35% | Wessen et al. (2013), Fig. 8b: CML 4 technical margins of at least 35% for spacecraft dry mass, power and energy |

The game uses **80%** as its nominal review threshold. Wessen et al. explicitly caution that 80% is not a special or rigid cutoff; engineering judgment applies (§V).

### Role sign-offs

| Role | Signs off when… |
|---|---|
| **Director** | Mass, budget and time margins are not negative |
| **Engineer** | Delta-v, power and battery margins are healthy (plus ion power if used), and the engineering check passes |
| **Science** | Science return reaches the contract target |
| **Comms** | Comms and data-storage margins are healthy and data is actually returned |

These are four automatic checks labelled by role, not separate players. **Role-per-player team play is planned, not built.**

### Outcomes, stars and score

- **Outcomes:** *Mission accomplished*, *Partial success* or *Mission lost*.
- **1★** survive the mission · **2★** meet the baseline science target · **3★** earn all four sign-offs **and** spend under 85% of the budget.
- Score weights (science, budget savings, stars, sign-off bonus) live in `DATA.scoringWeights` in `js/api/gameData.js`, not in the logic.

### Random-looking events are rule-based

Events such as a solar flare, ground-station outage or computer glitch trigger from the design and orbit, and each has an immunity you can build in. A hardened bus protects against flares, and a data recorder protects against an outage. The same design always meets the same events.

### Every failure explains itself

Each failed check carries a plain-English **why**, a **fix** and a **source or "simplified" tag**, shown in the debrief. The debrief also compares your design with real missions, such as Terra, Lunar Reconnaissance Orbiter, Mars Reconnaissance Orbiter, MAVEN and others.

---

## Career mode and destinations

Earth, the Moon and Mars start open. Safe arrivals unlock the rest in a chain:

| Unlock | Requires safe arrival at | Rank |
|---|---|---|
| Venus | Earth and Moon | Orbital Cadet |
| Jupiter | Mars and Venus | Deep-Space Navigator |
| Saturn | Jupiter | Ring Rider |
| Uranus | Saturn | Ice Voyager |
| Neptune | Uranus | Edge Walker |
| Mercury | Neptune | Fire Walker |
| The Sun | Mercury | Master of the Solar System |

- Far from the Sun, solar wings give almost nothing. The **radioisotope generator** (`rtg`) makes power regardless of sunlight.
- The Sun can never be reached. The launch plays out why (you would have to cancel Earth's ~29.8 km/s orbital speed).
- Progress and achievements are saved in the browser (`localStorage.apogeeCareer`). The game works with storage blocked.
- Planet briefings and Sun-dive text are in `js/content.js`. Destination feasibility ratings are in `js/core/planets.js`.

---

## Flight view and manual burns

Stage 3 opens with a terminal countdown from T-10 to lift-off, shown over the flight window with a countdown sound and a status line at each step. It runs on the same pause clock as the flight, so Pause freezes it and Resume continues it. Skip animation ends it at once. Then the flight plays on a canvas. The ascent is one continuous camera move: the camera follows the rocket from the pad while zooming out, the ground curves into a horizon and then a globe, and the rocket shrinks into the arrow used on the transfer map. After that comes a top-down transfer map (Earth-centred for Earth and Moon missions, Sun-centred for planets, **not to scale**), orbit arrival, and the failure and Sun-dive sequences. The view only draws what `resolveFlight()` returns, so the picture can never disagree with the result.

**Manual burns (optional).** You can fly two burns by hand, in mission order:

1. **Departure burn** after the transfer is planned.
2. **Orbit insertion burn** on arrival (narrower green zone, so it is harder).

Hold the button (or Space) and release inside the green zone. Together the burns can add up to **+6% science** (`DATA.flightModel.burnBonusMax`, a simplified gameplay value). Each burn is worth its precision × its weight (0.5 each) of that cap. **Auto-pilot** gives no bonus and no penalty, so a miss is never worse than skipping. The Skip animation button and reduced-motion setting shorten the animation but never remove the choice between manual burns and Auto-pilot.

**Flight menu (home, pause, resume, restart).** During the launch stage the header shows a **Menu** button. It (or the `M` key) opens a pause menu in the middle of the screen with four options: **Home** (or `Backspace`; back to the title screen), **Pause** (or press `P`) freezes the animation, the burn gauge, the mission-log timing and the sound, **Resume** (or press `X`) continues, and **Restart** (or press `R`) flies the same design again from lift-off (same design and seed, so the outcome does not depend on luck). `Esc` or the Close link hides the menu. If you pause while holding a burn, that burn starts over on resume.

---

## Developer Mode (testing shortcut)

Developer Mode is a hidden switch for teammates, judges and testers who want to reach any destination or see a finished design without grinding through the career chain. It is **not part of the normal game** and changes no numbers: the engine, scoring and debrief work exactly the same.

**Turn it on or off (the same action toggles it):**

- **Keyboard:** on any screen, type `Eventhorizon` (capital E only, the rest lower case) while no text field is focused.
- **Mouse or touch:** tap or click the game title on the title screen **5 times** within about 2 seconds. This is the way to do it on a phone.

A toast message confirms the change, and a **Developer Mode** badge appears next to the Stage 1 heading.

**What it does:**

| Feature | Behaviour |
|---|---|
| **All destinations open** | Every contract is unlocked, including those normally gated by the career chain (Venus to the Sun). |
| **Reference design library** | In **My builds**, a Developer Mode section lists reference designs for testing (defined as `DEVELOPER_REFERENCE_DESIGNS` in `js/core/engine.js`). Load one to jump to the Build stage with its contract, orbit, launcher and parts, then edit and launch it. These are starting points for testing, not guaranteed 3★ designs. |
| **Career rank** | The rank label reads *Developer Mode (All Maps)*. |

**Good to know:**

- It **persists** in the browser as `dev: true` inside `localStorage.apogeeCareer`, so it survives a page reload. Toggle it off the same way you turned it on.
- **Reset career** clears it, together with saved progress and saved builds.
- Arrivals made in Developer Mode count in your career progress and achievements like any other flight. Use **Reset career** before a clean run or a recorded demo.
- If browser storage is blocked, the mode still works for the current page but is not remembered.
- Reference designs are shown only while Developer Mode is on. Loading one while it is off shows a message asking you to unlock Developer Mode first.

### Reference design auto-pilot smoke-test snapshot

These are the final headless smoke-test results for each reference design with auto-pilot (science is shown as result / target; cost as actual / cap):

| Destination | Outcome with auto-pilot | Science vs target | Cost vs cap |
|---|---|---:|---:|
| Earth | Partial | 70.0 / 76 | 332 / 305 |
| Moon | Partial | 69.6 / 74 | 461 / 430 |
| Mars | Partial | 54.7 / 82 | 497 / 640 |
| Mercury | Partial | 49.1 / 64 | 803 / 1,200 |
| Venus | Partial | 62.7 / 72 | 475 / 820 |
| Jupiter | Lost | 11.1 / 34 | 732 / 1,020 |
| Saturn | Lost | 15.2 / 34 | 732 / 1,080 |
| Uranus | Lost | 7.8 / 25 | 937 / 1,180 |
| Neptune | Lost | 7.7 / 25 | 951 / 1,280 |
| Sun | Lost | 0.0 / 55 | 785 / 980 |

---

## Project structure

```text
Apogee/
└── Nasa-space-app-challenge/
    ├── .gitignore
    ├── index.html                 # Entry page; loads js/main.js as an ES module
    ├── README.md                  # This file
    ├── resources.md               # Asset source notes
    ├── assets/
    │   ├── *.svg                  # Spacecraft parts, destinations, launchers, instruments and plumes
    │   ├── audio/                 # Landing.mp3, design.mp3, win.mp3, loss.mp3, countdown.mp3
    │   └── bg/                    # space.mp4 and README.txt
    ├── css/
    │   ├── variables.css          # Colors and fonts
    │   ├── base.css               # Reset, typography and layout
    │   ├── components.css         # Buttons, cards, HUD and modals
    │   └── pages/
    │       ├── dashboard.css      # Objective and builder dashboard
    │       └── simulation.css     # Launch and flight view
    └── js/
        ├── main.js                # Bootstrap and page wiring
        ├── config.js              # Constants, part sizes, attachment nodes and API config
        ├── content.js             # Player-visible text and planetary briefings
        ├── api/
        │   ├── gameData.js        # Game data and source/verification tags
        │   └── nasaService.js     # Optional live NASA DONKI fetch and offline fallback
        ├── core/
        │   ├── engine.js          # Telemetry, margins, scoring and flight resolution
        │   ├── state.js           # Shared state, saves, undo and AudioEngine
        │   ├── planets.js         # Destination feasibility ratings and briefings
        │   └── career.js          # Unlock chain, ranks, achievements and saved progress
        └── ui/
            ├── domElements.js     # Cached selectors and small helpers
            ├── renderer.js        # HTML and canvas rendering
            └── controls.js        # Mouse, touch and keyboard event handlers
```

### Layers and who owns them

| Layer | Files | Owner |
|---|---|---|
| Page, styles, UI, entry | `index.html`, `css/*`, `js/ui/*`, `js/main.js`, `js/config.js` | Person B (Saurav) |
| Engine and NASA API layer | `js/core/engine.js`, `js/core/state.js`, `js/api/nasaService.js` | Person A (Asmin) |
| Content and data values, docs | `js/content.js`, values in `js/api/gameData.js`, `README.md` | Person C (Yochan) |

**Design rules we followed:** the engine is pure logic with no DOM access, the UI only renders, all player-visible text lives in `content.js`, and the data model lives in `js/api/gameData.js`.

---

## Data honesty: what is real and what is simplified

Every tagged data entry in `js/api/gameData.js` has a `src` tag and a `verified` flag. The final headless smoke-test tag summary reports:

| Source tag or count | Final count |
|---|---:|
| `Standard gravity constant (SI definition)` | 1 |
| `SIMPLIFIED_FOR_GAMEPLAY` | 93 |
| `NASA Planetary Fact Sheet (derived)` | 7 |
| `NASA CubeSat 101 (p. 13)` | 2 |
| `Wessen et al. (2013), Fig. 8b` | 1 |
| `Wessen et al. (2013), §V` | 1 |
| `NASA DONKI Space Weather / SIMPLIFIED_FOR_GAMEPLAY` | 1 |
| `UNVERIFIED_MEMORY` | 21 |
| Entries with `verified: true` | 12 |

The seven planetary solar-flux factors (Mercury, Venus, Mars, Jupiter, Saturn, Uranus and Neptune) are derived from the NASA Planetary Fact Sheet's mean distance-from-Sun row using `(Earth distance / planet distance)^2`. Earth and Moon remain normalized gameplay values; the Sun's value is a scripted-loss placeholder tagged `SIMPLIFIED_FOR_GAMEPLAY`. The 21 remaining `UNVERIFIED_MEMORY` entries are the real-mission comparison records; they were not revalidated in this update and remain unverified.

- `verified: true` means a value is stated in or derived from a source that was read for this update. Derived values identify the source and formula in their notes.
- `src: 'SIMPLIFIED_FOR_GAMEPLAY'` means the value is chosen for playability rather than asserted as a real-world specification. This covers component masses, costs, power and data rates, launcher capacities and prices, engine specifications, and other game-balance parameters.
- `src: 'UNVERIFIED_MEMORY'` means the value has not been checked against its source. Do not treat those entries as verified mission-history facts.

If you spot a value that looks wrong, its tag indicates how much to trust it.

---

## NASA resources used

| Resource | How it is used |
|---|---|
| **NASA DONKI Space Weather API** (`api.nasa.gov/DONKI/FLR` and `/CME`) | **Live data that drives a mechanic.** `nasaService.js` fetches the last 30 days of solar flares and coronal mass ejections, finds the peak flare class, and sets a radiation multiplier (0.96 nominal, 1.05 elevated, 1.15 severe). The header label shows **Live NASA data** or **Offline sample**. Requests have a 6-second timeout and a 30-minute cache, and fall back to offline values, so a failed fetch never breaks the game. |
| **NASA CubeSat 101** (CubeSat Launch Initiative, Oct 2017) | The 10% budget-reserve rule and other mission-design guidance behind the margin policies. |
| **JPL: Space Mission Concept Development Using Concept Maturity Levels** (Wessen et al., 2013) | Figure 8b lists 35% CML 4 technical margins for dry mass, power and energy; §V describes 80% as a nominal checklist-completion guide, not a rigid cutoff. |
| **NASA SE webinar: Design and Develop Science Missions** (J. Levri, Mar 2025) | Mission-design framing (needs, concept, requirements, design, verify). |
| NASA NSSDCA Planetary Fact Sheet (Metric), individual planet fact sheets, NASA Moon Fact Sheet and NASA Sun Fact Sheet | Reference for briefing gravity, gravity ratios, mean temperatures, day lengths, atmospheric composition and moon counts. Solar-flux ratios are derived from the Fact Sheet's "Distance from Sun (10^6 km)" row. |
| NASA Basics of Space Flight | Background for the delta-v and transfer-orbit model. |
| NASA GSFC Integrated Design Center, Dome Lab · NASA Mission Viz (X3Dom tutorial series) | Inspiration for the mission-design and flight-visualization approach. Not embedded or used as a dependency. |
| NASA Image and Video Library: *A Future in Orbit* | Background video `assets/bg/space.mp4`. |

NASA is not affiliated with this project and does not endorse it. No NASA logos or branding are used.

---

## References and credits

### Links provided by the team

| Used for | Source |
|---|---|
| Planetary and mission data | [Design and Develop Science Missions (NASA SE webinar PDF)](https://www.nasa.gov/wp-content/uploads/2025/04/250323-design-and-develop-science-mission.pdf?emrc=a454cf) |
| Mission-design inspiration | [NASA GSFC Integrated Design Center: Dome Lab](https://etd.gsfc.nasa.gov/integrated-design-center/dome-lab/) |
| Mission visualization reference | [NASA Mission Viz: Web Mission Visualization Tutorial Series](https://nasa.github.io/mission-viz/X3Dom/WebMissionVisualizationTutorialSeries.html) |
| Background video | [NASA Image and Video Library](https://images.nasa.gov/search?q=orion&page=1&media=video,audio&yearStart=1920&yearEnd=2026) (clip: *A Future in Orbit*, see `resources.md`) |
| Sound references | [NASA on SoundCloud](https://soundcloud.com/nasa) (team-provided link; not yet confirmed as the source of any file in `assets/audio/`) |

### Music

All tracks are in `assets/audio/`. Audio never autoplays; it starts only after the player interacts with the page.

| Game moment | File | Track | Source |
|---|---|---|---|
| Title / Objective (landing) | `Landing.mp3` | *Adrift Among Infinite Stars*, Scott Buckley (not AI-generated; CC BY 4.0; re-encoded at 128 kbps, reducing the file from 16.2 MB to 6.5 MB) | [Scott Buckley](https://www.scottbuckley.com.au/2022/02/new-library-track-adrift-among-infinite-stars/) |
| Build (design) | `design.mp3` | *Misty Echoes of Neptune* (AI-generated) | [StockTune](https://stocktune.com/free-music/misty-echoes-of-neptune-279973-165413?signup=true) |
| Success (win) | `win.mp3` | *Interstellar Jazz Adventure* (AI-generated) | [StockTune](https://stocktune.com/free-music/interstellar-jazz-adventure-148637-98792) |
| Mission lost | `loss.mp3` | Kevin MacLeod (not AI-generated; track title to be added; CC BY 4.0 as stated by the team) | [incompetech.com](https://incompetech.com/) |
| Pre-launch countdown | `countdown.mp3` | Countdown sound effect | Source not recorded in the repository yet; add the creator and licence before submission |

Countdown music : https://audio.com/jade-compass/audio/countdown-from-10-by-voicebosch-royalty-free-music-983091

Each track is used under the licence stated on its source page.

### Art and visuals

Some of the SVG artwork in `assets/` was made with AI assistance. The background video `assets/bg/space.mp4` comes from the NASA Image and Video Library; it is not AI-generated. No NASA logos or branding are used.

---

## AI use disclosure

AI tools assisted with parts of the implementation and presentation:

- **Tools:** Gemini and Claude were used throughout development; ChatGPT assisted with this source-verification and documentation update.
- **Code:** AI assistance was used to write and debug code.
- **Text:** AI assistance was used to write and edit text, including this README and in-game text.
- **Visual assets:** AI assistance was used to make some visual design assets; some SVG artwork in `assets/` was made with AI assistance. No file-by-file claim is made here.
- **AI-generated music:** `design.mp3` (*Misty Echoes of Neptune*) and `win.mp3` (*Interstellar Jazz Adventure*) were generated through StockTune.
- **Not AI-generated:** `Landing.mp3` is by Scott Buckley (CC BY 4.0); `loss.mp3` is by Kevin MacLeod via incompetech.com; `space.mp4` is from the NASA Image and Video Library.
- **Human contribution:** the team created the concept and mission scenarios, made the design decisions, and chose the data sources.
- AI-assisted source files carry headers naming the tool, date and human reviewer, Person C (Yochan).
- The pre-launch countdown was ported from the `secondday` branch with AI assistance (Claude, 2026-11-15). It is marked as not yet reviewed by a human.

---

## Accessibility and technical limits

- Keyboard-playable with visible focus, labeled controls and `aria-live` updates for the dashboard and toasts.
- Information is never conveyed by color alone: meters and alerts use text and tags (**CRITICAL**, **THIN MARGIN**) as well.
- Designed for screens from 360 px wide up to desktop.
- Respects `prefers-reduced-motion`.
- Player-entered text (build names and share codes) is escaped before display, and share codes are validated before loading.
- No `alert()` or `confirm()` pop-ups, no trackers and no analytics.
- There is no online multiplayer, no accounts and no server.
- Not supported: opening `index.html` directly from the file system (`file://`).

---

*Data and resources from NASA are credited above. This project is an educational simulation using a simplified engineering model, not an official NASA product.*
