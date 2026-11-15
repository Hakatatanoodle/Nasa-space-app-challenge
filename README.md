<!-- File: README.md
  Owner: Person C (Yochan)
  AI-assisted: YES — Claude, 2026-11-15. Reviewed by a human: Yochan.
  Sources used: NASA_CUBESAT101, JPL_CML, NASA_SE_WEBINAR, SPACEAPPS_CHALLENGE, plus the external links listed in "References"
-->

# APOGEE — Space Mission Design Game

> **Every kilogram is a decision.**

APOGEE is a browser game where you design a complete space mission: pick a destination, build a spacecraft part by part, choose an engine and a launch vehicle, fly the launch, and read a debrief that explains *why* you succeeded or failed. Mass, power, budget, data, communications and time all pull against each other, and there is rarely one perfect answer.

It was built for the **NASA Space Apps Challenge 2026** (challenge: *Space Mission Design Game*). It is plain HTML, CSS and vanilla JavaScript (native ES6 modules). There is no framework, no npm and no build step.

**Live game:** https://apogee-alpha-tawny.vercel.app/
**Team:** Person A — Ashmin (engine, NASA data layer) · Person B — Saurav (UI, entry, styles) · Person C — Yochan (content, data values, docs)

---

## Table of contents

1. [How to play in 3 steps](#how-to-play-in-3-steps)
2. [Game features](#game-features)
3. [Run it locally](#run-it-locally)
4. [How the simulation works](#how-the-simulation-works)
5. [Career mode and destinations](#career-mode-and-destinations)
6. [Flight view and manual burns](#flight-view-and-manual-burns)
7. [Project structure](#project-structure)
8. [Data honesty: what is real and what is simplified](#data-honesty-what-is-real-and-what-is-simplified)
9. [NASA resources used](#nasa-resources-used)
10. [References and credits](#references-and-credits)
11. [AI use disclosure](#ai-use-disclosure)
12. [Accessibility and technical limits](#accessibility-and-technical-limits)

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
- **Solo or team play (hot-seat on one device).** Four roles (Director, Engineer, Science, Comms) each sign off a part of the design. All four sign-offs are needed for a 3-star result.
- **Save, load and compare builds,** plus a **Share / Load code** to copy a design as a text code.
- **Live space weather** from NASA DONKI feeds a radiation multiplier, with an offline fallback (see [NASA resources used](#nasa-resources-used)).
- **Optional manual burns** during the flight for up to +6% science.
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
| Easy | 10% | NASA CubeSat 101 (p. 13): budgets should carry at least a 10% reserve |
| Hard ("by the book") | 35% | JPL CML 4 checklist (Wessen et al., 2013, Fig. 8b): 35% on dry mass, power and energy |

A design review passes when at least **80%** of checklist items are complete, following the JPL concept-maturity rule (§V).

### Role sign-offs

| Role | Signs off when… |
|---|---|
| **Director** | Mass, budget and time margins are not negative |
| **Engineer** | Delta-v, power and battery margins are healthy (plus ion power if used), and the engineering check passes |
| **Science** | Science return reaches the contract target |
| **Comms** | Comms and data-storage margins are healthy and data is actually returned |

### Outcomes, stars and score

- **Outcomes:** *Mission accomplished*, *Partial success* or *Mission lost*.
- **1★** survive the mission · **2★** meet the baseline science target · **3★** earn all four sign-offs **and** spend under 85% of the budget.
- Score weights (science, budget savings, stars, sign-off bonus) live in `DATA.scoringWeights` in `js/api/mockData.js`, not in the logic.

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

Stage 3 plays the flight on a canvas. The ascent is one continuous camera move: the camera follows the rocket from the pad while zooming out, the ground curves into a horizon and then a globe, and the rocket shrinks into the arrow used on the transfer map. After that comes a top-down transfer map (Earth-centred for Earth and Moon missions, Sun-centred for planets, **not to scale**), orbit arrival, and the failure and Sun-dive sequences. The view only draws what `resolveFlight()` returns, so the picture can never disagree with the result.

**Manual burns (optional).** You can fly two burns by hand, in mission order:

1. **Departure burn** after the transfer is planned.
2. **Orbit insertion burn** on arrival (narrower green zone, so it is harder).

Hold the button (or Space) and release inside the green zone. Together the burns can add up to **+6% science** (`DATA.flightModel.burnBonusMax`, a simplified gameplay value). Each burn is worth its precision × its weight (0.5 each) of that cap. **Auto-pilot** gives no bonus and no penalty, so a miss is never worse than skipping. The Skip animation button and reduced-motion setting shorten the animation but never remove the choice between manual burns and Auto-pilot.

**Flight menu (pause, resume, restart).** During the launch stage the header shows a Flight menu. **Pause** (or press `P`) freezes the animation, the burn gauge, the mission-log timing and the sound; **Resume** (or `P` again) continues. If you pause while holding a burn, that burn starts over on resume. **Restart** throws the flight away and flies the same design again from lift-off (same design and seed, so the outcome does not depend on luck).

---

## Project structure

```text
Apogee/
├── index.html                  # Entry page, loads js/main.js as an ES module
├── README.md                   # This file
├── resources.md                # Source note for the background video
├── .gitignore
│
├── assets/
│   ├── *.svg                   # Spacecraft parts, destinations, launchers, plumes (drawn for this project)
│   ├── audio/                  # Landing.mp3, design.mp3, win.mp3
│   ├── bg/                     # space.mp4 (looping background video) + README.txt
│   ├── images/  icons/         # Reserved (currently empty)
│
├── css/
│   ├── variables.css           # Colors and fonts
│   ├── base.css                # Reset, typography, layout
│   ├── components.css          # Buttons, cards, HUD, modals
│   └── pages/
│       ├── dashboard.css       # Objective / builder dashboard
│       └── simulation.css      # Launch and flight view
│
├── js/
│   ├── main.js                 # Bootstrap: wires everything on page load
│   ├── config.js               # Constants, part sizes, attachment nodes, API config
│   ├── content.js              # ALL player-visible text (briefs, lessons, help, glossary)
│   ├── api/
│   │   ├── mockData.js         # DATA: every game number, each with src + verified
│   │   └── nasaService.js      # Optional live NASA DONKI fetch + offline fallback
│   ├── core/
│   │   ├── engine.js           # Pure logic: telemetry, margins, scoring, flight resolution
│   │   ├── state.js            # Shared state, saves, undo, AudioEngine
│   │   ├── planets.js          # Destination feasibility ratings and briefings
│   │   └── career.js           # Unlock chain, ranks, achievements, saved progress
│   └── ui/
│       ├── domElements.js      # Cached selectors and small helpers
│       ├── renderer.js         # Draws state to HTML / canvas
│       └── controls.js         # Event listeners (mouse, touch, keyboard)
│
└── data/
    └── sample-dataset.json     # Reserved (currently empty); the game uses mockData.js
```

### Layers and who owns them

| Layer | Files | Owner |
|---|---|---|
| Page, styles, UI, entry | `index.html`, `css/*`, `js/ui/*`, `js/main.js`, `js/config.js` | Person B (Saurav) |
| Engine and NASA API layer | `js/core/engine.js`, `js/core/state.js`, `js/api/nasaService.js` | Person A (Ashmin) |
| Content and data values, docs | `js/content.js`, values in `js/api/mockData.js`, `README.md` | Person C (Yochan) |

**Design rules we followed:** the engine is pure logic with no DOM access, the UI only renders, all player-visible text lives in `content.js`, and all numbers live in `mockData.js`.

---

## Data honesty: what is real and what is simplified

Every number in `js/api/mockData.js` carries a `src` tag and a `verified` flag:

- `verified: true` means the value is stated in one of our sources (for example the 10% budget reserve from NASA CubeSat 101, the 35% margin from the JPL CML checklist, the 80% maturity threshold, and standard gravity `g0`).
- `src: 'SIMPLIFIED_FOR_GAMEPLAY'` means we chose the value so the game plays well. This covers **all** component masses, costs, power and data rates, launcher capacities and prices, and engine specs. **These are not real NASA or vendor specifications.**
- `src: 'UNVERIFIED_MEMORY'` marks values recalled from memory and not yet checked against a source. This includes the Mars solar-flux ratio and the list of real missions used for comparison in the debrief. **Please verify these before treating them as fact.**

If you spot a value that looks wrong, the tag tells you how much to trust it.

---

## NASA resources used

| Resource | How it is used |
|---|---|
| **NASA DONKI Space Weather API** (`api.nasa.gov/DONKI/FLR` and `/CME`) | **Live data that drives a mechanic.** `nasaService.js` fetches the last 30 days of solar flares and coronal mass ejections, finds the peak flare class, and sets a radiation multiplier (0.96 nominal, 1.05 elevated, 1.15 severe). The header label shows **Live NASA data** or **Offline sample**. Requests have a 6-second timeout and a 30-minute cache, and fall back to offline values, so a failed fetch never breaks the game. |
| **NASA CubeSat 101** (CubeSat Launch Initiative, Oct 2017) | The 10% budget-reserve rule and other mission-design guidance behind the margin policies. |
| **JPL: Space Mission Concept Development Using Concept Maturity Levels** (Wessen et al., 2013) | The 35% margin policy and the 80% design-review threshold. |
| **NASA SE webinar: Design and Develop Science Missions** (J. Levri, Mar 2025) | Mission-design framing (needs, concept, requirements, design, verify). |
| NASA Planetary Fact Sheet (Metric) · NASA/JPL Planetary Physical Parameters · NASA Moon Fact Sheet | Reference for the planet briefings (gravity, temperature, day length, moons). |
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
| Sounds | [NASA on SoundCloud](https://soundcloud.com/nasa) |

### Music

All tracks are in `assets/audio/`. Audio never autoplays; it starts only after the player interacts with the page.

| Game moment | File | Track | Source |
|---|---|---|---|
| Title / Objective (landing) | `Landing.mp3` | *Adrift Among Infinite Stars*, Scott Buckley | [scottbuckley.com.au](https://www.scottbuckley.com.au/2022/02/new-library-track-adrift-among-infinite-stars/) |
| Build (design) | `design.mp3` | *Misty Echoes of Neptune* | [StockTune](https://stocktune.com/free-music/misty-echoes-of-neptune-279973-165413?signup=true) |
| Success (win) | `win.mp3` | *Interstellar Jazz Adventure* | [StockTune](https://stocktune.com/free-music/interstellar-jazz-adventure-148637-98792) |
| Mission lost | `loss.mp3` (see note below) | Kevin MacLeod | [incompetech.com](https://incompetech.com/) and [YouTube](https://www.youtube.com/watch?v=Jhw0F4gvYfM) |

> **Note for the team:** `content.js` points to `assets/audio/loss.mp3`, but that file is **not in the repository yet**. Until it is added, the "mission lost" screen plays no music (the game handles the missing file without errors). Add the file, or update the path in `CONTENT.audioTracks.loss`.
> Please also confirm each track's licence terms and add the exact attribution wording the creators require (several of these sites ask for credit in the project description).

### Art and visuals

- All spacecraft, destination, launcher and plume graphics in `assets/*.svg` are vector files made for this project.
- No stock photos, no NASA imagery or logos, and no real people or faces are used in the game.

---

## AI use disclosure

AI tools were used in this project, as required by the Space Apps rules:

- **Tools:** Gemini and Claude were used to help write and review code (engine, UI, data and content modules) and, in this case, this README.
- **Every AI-assisted file** carries a header naming the tool, date and human reviewer, and the team keeps a log of AI-assisted changes.
- **The game concept, mission scenarios, design decisions and data sources were chosen by the team,** not by AI. The AI helped implement and review them.
- **No AI-generated images or video** are used. Audio is third-party music credited above.

---

## Accessibility and technical limits

- Keyboard-playable with visible focus, labeled controls and `aria-live` updates for the dashboard and toasts.
- Information is never conveyed by color alone: meters and alerts use text and tags (**CRITICAL**, **THIN MARGIN**) as well.
- Designed for screens from 360 px wide up to desktop.
- Respects `prefers-reduced-motion`.
- Player-entered text is written with `textContent`, never `innerHTML`.
- No `alert()` or `confirm()` pop-ups, no trackers and no analytics.
- Team mode is **hot-seat on one device**. There is no online multiplayer, no accounts and no server.
- Not supported: opening `index.html` directly from the file system (`file://`).

---

*Data and resources from NASA are credited above. This project is an educational simulation using a simplified engineering model, not an official NASA product.*