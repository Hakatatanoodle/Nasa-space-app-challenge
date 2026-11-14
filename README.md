# NASA Space Apps Challenge Project

A modular, vanilla HTML/CSS/JavaScript web application built for the NASA Space Apps Challenge.

## Project Folder Structure

~~~text
Nasa-space-app-challenge/
├── index.html                  # Main entry point (loads ES6 modules)
├── README.md                   # Project documentation and setup guide
├── .gitignore                  # Ignores secrets, .env, and OS files
│
├── assets/                     # Static media files
│   ├── images/                 # Sprites, backgrounds, textures
│   ├── icons/                  # UI icons and favicons
│   └── audio/                  # Sound effects and background audio
│
├── css/                        # Modular stylesheets
│   ├── variables.css           # Global CSS custom properties (:root colors, fonts)
│   ├── base.css                # Reset, typography, and layout rules
│   ├── components.css          # Reusable UI (buttons, cards, HUD, modals)
│   └── pages/                  # View-specific styles
│       ├── dashboard.css
│       └── simulation.css
│
├── js/                         # Vanilla ES6 Modules (<script type="module">)
│   ├── main.js                 # App entry point & initialization
│   ├── config.js               # API endpoints, constants, and feature flags
│   │
│   ├── api/                    # Data fetching & fallback layer
│   │   ├── nasaService.js      # Fetch & parse NASA Open API data
│   │   └── mockData.js         # Offline JSON fallback for demos
│   │
│   ├── core/                   # Application state & simulation engine
│   │   ├── state.js            # Centralized shared state
│   │   ├── engine.js           # Core logic, math, and render/update loop
│   │   ├── planets.js          # Destination feasibility ratings and planet briefings
│   │   └── career.js           # Career mode: unlock chain, achievements, saved progress
│   │
│   └── ui/                     # DOM interaction & rendering
│       ├── domElements.js      # Cached DOM element selectors
│       ├── renderer.js         # Renders state updates to HTML/Canvas
│       └── controls.js         # Event listeners (keyboard, mouse, sliders)
│
└── data/                       # Static local datasets (JSON, GeoJSON, CSV)
    └── sample-dataset.json
~~~


## Career mode and all planets

Earth, the Moon and Mars start open. Safe arrivals unlock Venus, Jupiter, Saturn, Uranus, Neptune, Mercury and finally the Sun, which can never be reached (the launch plays out why). Progress and achievements are saved in the browser (`localStorage.apogeeCareer`).

- New destinations are appended after the original three contracts in `js/api/mockData.js`, so contract indices, saved candidates and share codes keep working. Values are tagged `SIMPLIFIED_FOR_GAMEPLAY` or `UNVERIFIED_MEMORY`, not official NASA data.
- Far from the Sun, solar wings give almost nothing: the radioisotope generator (`rtg`) makes power regardless of sunlight.
- Each destination can set its own design life (`contract.life`); the original three still use the 36-month default.
- Planet briefing text and the Sun dive text live in `js/content.js`.
