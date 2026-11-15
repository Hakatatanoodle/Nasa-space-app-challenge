/* File: js/content.js
 * Owner: Person C (Yochan)
 * AI-assisted (update): Claude, 2026-11-15 - flight menu text (pause / resume / restart). Reviewed by a human: YES, Person C (Yochan).
 * AI-assisted (update): ChatGPT, 2026-11-15 - reconciled planetary briefing gravity, gravity ratios, temperatures, day lengths, atmospheric composition and moon counts with NASA fact sheets. Reviewed by a human: YES, Person C (Yochan).
 * AI-assisted (update): Claude, 2026-11-15 - win/loss tightening (outcome bands, audio, demos). Reviewed by a human: YES, Person C (Yochan).
 * AI-assisted: YES — Gemini, 2026-11-14; Gemini, 2026-11-15; Claude, 2026-11-14; Claude, 2026-11-15 (two manual burns). Reviewed by a human: YES, Person C (Yochan).
 * Sources used: NASA NSSDCA Planetary Fact Sheet (Metric) and individual planet fact sheets; NASA Moon Fact Sheet; NASA Sun Fact Sheet (read 2026-11-15)
 */

export const CONTENT = {
  appName: 'APOGEE',
  tagline: 'Every kilogram is a decision.',
  bgVideo: 'assets/bg/space.mp4',
  bgCredit: '',
  audioTracks: {
    landing: 'assets/audio/Landing.mp3',
    design: 'assets/audio/design.mp3',
    win: 'assets/audio/win.mp3',
    loss: 'assets/audio/loss.mp3',
    countdown: 'assets/audio/countdown.mp3'
  },
  disclaimer: 'Mission design simulation — live NASA DONKI space weather + simplified spacecraft engineering model.',
  stageNames: ['Objective', 'Build', 'Launch', 'Debrief'],
  subResources: ['Delta-v', 'Battery', 'Ion power'],
  uiLabels: {
    alertsHeading: 'Engineering alerts',
    alertsClear: 'All margins & checks clear',
    alertsCount: '{red} critical · {amber} thin',
    alertCriticalTag: 'CRITICAL',
    alertAmberTag: 'THIN MARGIN',
    massTopic: 'Mass & Propulsion',
    powerTopic: 'Power & Energy',
    commsEmptyHint: 'No antenna installed — attach an antenna to transmit science data.'
  },
  outcomeLabels: {
    success: 'Mission accomplished',
    partial: 'Partial success',
    lost: 'Mission failed'
  },
  marginFormulaTooltip:
    'Margin % = (Capacity − Predicted Use) ÷ Predicted Use × 100. Project convention; NASA programs define reserves per mission phase.',
  glossary: {
    'Delta-v': 'Total velocity change (m/s) available from propellant via the rocket equation.',
    Margin: 'Reserve capacity above predicted demand to absorb design growth.',
    Eclipse: 'Fraction of each orbit spent in planetary shadow where solar panels generate zero power.'
  },
  contractBriefs: {
    earth: "Watch Earth's climate: clouds, heat and ice.",
    moon: 'Map lunar minerals and hunt for buried ice.',
    mars: 'Map Mars and find where water hides.',
    mercury: 'Orbit the closest planet to the Sun. A furnace by day, a freezer by night.',
    venus: 'Peer through the clouds of Earth’s hellish twin.',
    jupiter: 'Orbit the giant. Sunlight is 27 times weaker and the radiation is brutal.',
    saturn: 'Orbit the ringed giant. Distant, dim and slow to reach.',
    uranus: 'Orbit the tipped-over ice giant. Almost no sunlight, a faint whisper of signal.',
    neptune: 'Orbit the most distant planet. Sunlight is 900 times weaker than at home.',
    sun: 'Fly to the Sun. (Spoiler: physics says no.)'
  },
  orbitDescriptions: {
    'Low polar orbit': 'Sharp views, short shadows, limited ground-station contact windows.',
    'Medium orbit': 'Wider view and longer contact, with higher radiation exposure.',
    Geostationary: 'Continuous contact and sunlight, high delta-v requirement, distant view.',
    'Elliptical orbit': 'Balanced surface resolution and ground-station contact.',
    'Halo-type orbit': 'Low station-keeping cost and high contact, distant view.',
    'Low orbit': 'Sharp resolution, costly insertion, weak solar flux at Mars.',
    'High orbit': 'Lower insertion delta-v, distant observation geometry.',
    'Elliptical orbit (12 h)': 'A MESSENGER-style compromise: brief hot passes, long cool ones.',
    'Polar elliptical orbit (Juno-like)': 'Sharp view, brutal radiation near the planet.',
    'Wide orbit among the moons': 'Visit Europa and Io, but live in the radiation belts.',
    'Distant capture orbit': 'Cheapest. Safer, far from the worst radiation.',
    'Ring-grazing polar orbit': 'Sharp view of the rings.',
    'Titan-tour orbit': 'Use Titan’s gravity to reshape your path.',
    'Distant orbit': 'Cheapest. Distant view.',
    'Polar orbit': 'Sharp view. Needs a big push and lots of reserves.',
    'Moon-tour orbit': 'Visit Titania, Oberon and Miranda.',
    'Triton-tour orbit': 'Study the captured moon with its geysers.',
    'Straight plunge': 'Cancel Earth’s sideways speed and fall in.',
    'Close flyby, Parker-style': 'Skim the corona and swing back out.'
  },
  partDescriptions: {
    chem: 'Strong and quick, thirsty for fuel.',
    nuclear: 'More than twice the efficiency, heavy and costly.',
    ion: 'Sips fuel, takes months, requires 1500 W of solar power.',
    bus_std: 'Low mass and cost; susceptible to radiation aging.',
    bus_rad: 'Radiation-shielded avionics for harsher orbits.',
    bus_red: 'Shielded electronics plus redundant flight computer.',
    rtg: 'Heat-powered. Works in the dark, far from the Sun.'
  },
  eventText: {
    solar_flare: {
      n: 'Solar flare & CME particle surge',
      txt: 'NASA DONKI space-weather telemetry flags active solar flare activity ({flareClass}) impacting this radiation environment.',
      immT: 'Your radiation-hardened bus shrugs off the energetic particle surge.',
      hitT: 'Without a hardened bus, avionics enter safe mode during the flare.',
      fix: 'Choose the hardened bus.',
      choices: [
        {
          label: 'Throttle down & enter safe-point (+8% science saved)',
          bonusFactor: 1.08,
          note: 'Flight Control points the bus edge-on to the Sun, salvaging partial observation windows.'
        },
        {
          label: 'Hold observation lock through storm (high risk)',
          bonusFactor: 0.96,
          note: 'Sensor noise corrupts extra frames during peak proton flux.'
        }
      ]
    },
    ground_outage: {
      n: 'Deep Space Network (DSN) weather outage',
      txt: 'Severe storms over a ground-station complex cut into your short daily downlink window.',
      immT: 'Your onboard data recorder buffers every observation until the next DSN pass.',
      hitT: 'With no data recorder, live observations are overwritten while the station is offline.',
      fix: 'Add a data recorder.',
      choices: [
        {
          label: 'Compress telemetry & prioritize key packets (+7% science saved)',
          bonusFactor: 1.07,
          note: 'Flight team switches to lossy compression to squeeze vital science through.'
        },
        {
          label: 'Keep uncompressed raw stream (drops packets)',
          bonusFactor: 0.97,
          note: 'Buffer overflow drops high-resolution frames.'
        }
      ]
    },
    computer_glitch: {
      n: 'Cosmic-ray flight computer single-event upset',
      txt: 'Months from Earth, a high-energy cosmic ray flips a memory bit and forces a primary flight-computer reboot.',
      immT: 'Your redundant backup flight computer takes over seamlessly with zero downtime.',
      hitT: 'With no backup computer, the spacecraft reboots slowly and misses prime orbital passes.',
      fix: 'Choose the hardened bus with the backup computer.',
      choices: [
        {
          label: 'Execute fast warm-restart sequence (+9% science saved)',
          bonusFactor: 1.09,
          note: 'Ground engineers uplink a rapid patch to recover attitude lock early.'
        },
        {
          label: 'Run full diagnostic memory scrub (slower recovery)',
          bonusFactor: 0.98,
          note: 'Safe diagnostics take extra orbits before instruments power back on.'
        }
      ]
    }
  },
  flightLog: {
    liftoff: '<b>Lift-off.</b> {launcher} carries {massKg} kg. Launch reliability {reliabilityPct}%.',
    tumble: 'Thrust and mass are {offPx} px out of line (limit {limitPx} px). The rocket tumbles off the pad.',
    ascent: 'Orbit insertion nominal. Reliability {reliabilityPct}% will scale your final score.',
    transfer: '<b>Transfer burn.</b> Need {needMs} m/s, spacecraft has {haveMs} m/s.',
    deltav_short: 'Propellant depleted {shortMs} m/s short of target orbit.',
    ion_short: 'Ion thruster power below {needW} W threshold; orbit transfer incomplete.',
    burn_departure: '<b>Departure burn.</b> Precision {precisionPct}%: science return +{bonusPct}%.',
    burn_departure_miss: '<b>Departure burn.</b> You missed the target zone, so there is no bonus. The craft still has the delta-v it needs.',
    burn_insertion: '<b>Orbit insertion burn.</b> Precision {precisionPct}%: science return +{bonusPct}%.',
    burn_insertion_miss: '<b>Orbit insertion burn.</b> You missed the narrow target zone, so there is no bonus. The craft still settles into orbit.',
    arrival: '<b>Arrived</b> after {days} days. Entering {orbit}.',
    feasibility:
      '<b>Feasibility check for {name}:</b> <span class="{cls}">{label}</span>. {notes}. Your craft has {haveMs} m/s of delta-v for {needMs} m/s needed, {haveW} W of power for {needW} W needed, and a trip of {days} days.',
    sun_dive: '{text}',
    sun_boom: '{text}',
    operations: '<b>Operations complete.</b> {returnedPct}% of data downlinked. Science return: <b>{science}</b> / {target} pts.'
  },
  flightFailures: {
    belowMinimum: 'Your spacecraft arrived, but it returned only {sciPts} science points. This contract needs at least {minPts} to count as a mission. Fix: add or upgrade instruments, raise data return with a better antenna or a recorder, or pick an orbit with sharper resolution.',
    tumble: {
      why: 'Center of mass was offset from the engine thrust line by more than the balance limit.',
      fix: 'Mirror heavy parts symmetrically left and right.'
    },
    deltav: {
      why: 'Insufficient delta-v: the propellant ran out before the target orbit.',
      fix: 'Add a propellant tank, switch to a higher-Isp engine, or reduce dry mass.'
    },
    ion: {
      why: 'The ion thruster did not get the 1500 W it needs, so the orbit transfer never finished.',
      fix: 'Add solar wings to supply at least 1500 W for electric propulsion.'
    },
    burn: '{name}: {precisionPct}% precision added {bonusPct}% to your science return (simplified gameplay bonus).',
    burnMiss: '{name}: you let go outside the target zone, so there was no bonus. Next time release while the gauge is inside the green zone.',
    burnSkipped: '{name}: Auto-pilot flew it, so there was no bonus and no penalty.',
    burnAuto: 'Tip: fly the departure burn and the orbit insertion burn by hand for up to {maxBonusPct}% extra science in total. Auto-pilot gives no bonus and no penalty.',
    dataReturn: 'Data downlink: only {returnedPct}% reached Earth. Upgrade antenna or add data storage.',
    eventLoss: 'Science reduced by {lossPct}%.',
    reliability:
      'Launch reliability {reliabilityPct}% (launcher {launcherPct}% x bus {busPct}%, adjusted by {adjustmentPct} points for thin margins, balance, sign-offs and review). Your final score is multiplied by {reliabilityPct}%.',
    reliabilityFix: ' Fix: turn amber rows green, balance the ship, or pick a more reliable launcher or bus.'
  },
  burn: {
    departure: {
      name: 'Departure burn',
      prompt: 'Departure burn. Hold the button (or press and hold Space) to fire the engine. Let go while the bar is inside the green zone. A clean burn adds up to {maxBonusPct}% science.'
    },
    insertion: {
      name: 'Orbit insertion burn',
      prompt: 'Orbit insertion burn. Same controls, but the green zone is narrower and in a different place. A clean burn adds up to {maxBonusPct}% science.',
      hud: 'Ready for orbit insertion'
    },
    hold: 'Hold to burn',
    firing: 'Burning...',
    auto: 'Auto-pilot (no bonus)',
    autoAll: 'Auto-pilot all burns',
    ready: 'Ready. Hold to start the burn.',
    low: 'Too early: keep holding.',
    inZone: 'In the zone: let go now!',
    high: 'Too late: you are over-burning.',
    result: 'Burn precision {precisionPct}%. Science bonus +{bonusPct}%.',
    missed: 'Burn missed the green zone. No bonus.',
    autoResult: 'Auto-pilot flies the burn. No bonus.',
    autoAllResult: 'Auto-pilot flies both burns. No bonus.',
    gaugeLabel: 'Burn gauge. The green zone runs from {zoneStartPct}% to {zoneEndPct}% full.'
  },
  flightHud: {
    canvasLabel: 'Flight view',
    skip: 'Skip animation',
    countdown: 'Terminal countdown',
    countdownDetail: '10 seconds',
    countdownBeats: [
      { label: '10', sub: 'External power disconnected', ms: 1000 },
      { label: '9', sub: 'Final flight computer alignment', ms: 1000 },
      { label: '8', sub: 'Tank pressurization sequence', ms: 1000 },
      { label: '7', sub: 'Gaseous nitrogen purge start', ms: 1000 },
      { label: '6', sub: 'Internal power transfer confirmed', ms: 1000 },
      { label: '5', sub: 'Launch pad arm retract', ms: 1000 },
      { label: '4', sub: 'Guidance & telemetry locked', ms: 1000 },
      { label: '3', sub: 'Main engine chilldown nominal', ms: 1000 },
      { label: '2', sub: 'Ignition sequence start', ms: 1000 },
      { label: '1', sub: 'All engines running', ms: 1000 },
      { label: 'LIFT-OFF', sub: 'Tower cleared', ms: 550 }
    ],
    logTitle: 'Mission log',
    ascent: 'Ascent',
    atmosphere: 'Leaving the atmosphere',
    reachOrbit: 'Reaching orbit',
    ready: 'Ready for departure burn',
    burning: 'Burning',
    coast: 'Coasting to {name}',
    day: 'Day {day} of {days}',
    stalled: 'Out of propellant',
    dive: 'Falling toward the Sun',
    orbit: 'In orbit: {orbit}',
    lost: 'Mission failed',
    complete: 'Operations complete',
    notToScale: 'Not to scale',
    menuLabel: 'Flight menu',
    menuButton: 'Menu',
    keyMenu: 'M',
    home: 'Home',
    keyHome: 'Backspace',
    close: 'Close menu (Esc)',
    keyPause: 'P',
    keyResume: 'X',
    keyRestart: 'R',
    statusFlying: 'Flying',
    statusPaused: 'Paused',
    statusComplete: 'Complete',
    pause: 'Pause',
    resume: 'Resume',
    restart: 'Restart',
    pausedTitle: 'Flight paused',
    pausedHint: 'Press X or Resume to continue.',
    restarted: 'Flight restarted from lift-off.'
  },
  predictedFlight: {
    heading: 'Predicted flight',
    note: 'No dice: the same design always flies the same way. Change the design to change the result.',
    noEvents: 'No flight events expected in this orbit.',
    eventImmune: 'protected',
    eventHit: 'will cost {lossPct}% science (mid-flight decision available)'
  },
  realMissionText: {
    Terra: 'Polar Earth-observing satellite carrying cameras and heat sensors for climate science.',
    'ICESat-2': 'Polar satellite measuring ice-sheet elevation with precision altimetry.',
    'GOES-R series': 'Geostationary weather satellites continuously monitoring one hemisphere.',
    'Lunar Reconnaissance Orbiter': 'Low polar lunar orbiter mapping the surface and hunting for polar ice.',
    'Lunar Prospector': 'Polar orbiter that detected hydrogen signatures near the lunar poles.',
    ARTEMIS: 'Two probes in stretched lunar orbits studying magnetic fields and solar wind.',
    'Mars Reconnaissance Orbiter': 'Low Mars orbiter with high-resolution camera, spectrometer, and subsurface radar.',
    'Mars Odyssey': 'Thermal imager and spectrometer mission that mapped near-surface water ice.',
    MAVEN: 'Elliptical Mars orbiter studying upper-atmosphere loss with a magnetometer.',
    MESSENGER: 'First orbiter at Mercury (2011 to 2015), in a 12-hour elliptical orbit with a sunshade.',
    BepiColombo: 'European-Japanese pair of orbiters sent to Mercury after many gravity-assist flybys.',
    Magellan: 'Radar orbiter that mapped nearly all of Venus through its clouds.',
    'Venus Express': 'European orbiter studying the atmosphere and clouds of Venus.',
    Akatsuki: 'Japanese climate orbiter watching Venus’s winds.',
    Galileo: 'First Jupiter orbiter, and it sent a probe into the atmosphere.',
    Juno: 'Solar-powered polar orbiter measuring Jupiter’s gravity, magnetic field and deep atmosphere.',
    Cassini: 'Orbited Saturn for 13 years and toured Titan and Enceladus. Powered by radioisotope generators.',
    'Voyager 2': 'The only spacecraft to visit Uranus (flyby 1986) and Neptune (flyby 1989).',
    'Parker Solar Probe': 'Flies through the corona behind a carbon-composite heat shield.',
    SOHO: 'Watches the Sun from a safe point 1.5 million km sunward of Earth.'
  },
  lessons: {
    Mass: {
      why: 'Total wet mass exceeds launcher payload capacity for this orbit.',
      fix: 'Use a larger launch vehicle, remove heavy instruments, or reduce fuel tanks.'
    },
    'Delta-v': {
      why: 'Propellant delta-v is below what is required to reach the target orbit.',
      fix: 'Add a fuel tank, switch to a higher-Isp engine, or trim dry mass.'
    },
    Power: {
      why: 'Average sunlit power generation cannot sustain continuous subsystem loads.',
      fix: 'Add solar wings (or RTGs in deep space) or remove power-hungry instruments.'
    },
    Battery: {
      why: 'Battery capacity is insufficient to power the spacecraft through orbital shadow (eclipse).',
      fix: 'Add batteries or select an orbit with shorter eclipse periods.'
    },
    Budget: {
      why: 'Total spacecraft and launch vehicle cost exceeds the mission budget cap.',
      fix: 'Choose a smaller launcher, use a standard bus, or trim optional instruments.'
    },
    'Data storage': {
      why: 'Onboard memory overflows while the spacecraft is out of ground-station contact.',
      fix: 'Add a data recorder or choose an orbit with more frequent ground contact.'
    },
    Comms: {
      why: 'Antenna downlink rate cannot transmit daily science data within available contact hours.',
      fix: 'Upgrade to a higher-gain antenna or reduce high-data instruments.'
    },
    Time: {
      why: 'Transit duration and space-weather radiation reduce useful life below mission requirements.',
      fix: 'Select a radiation-hardened bus or a faster propulsion system.'
    },
    'Ion power': {
      why: 'Ion thruster requires 1500 W of electrical power generation.',
      fix: 'Add solar wings until total generation meets 1500 W.'
    }
  },
  planetInfo: {
    earth: { name: 'Earth', grav: '9.8', gx: 1, env: 'Liquid-water oceans cover about 71% of the surface. Active plate tectonics and a global magnetic field that shields everything from the solar wind.', temp: 'Mean temperature 15 °C (roughly -90 to 57 °C)', atm: '78.08% nitrogen, 20.95% oxygen and trace gases; surface pressure is about 1 bar', day: '24.0 h day; the year is 365.2 days', moons: '1 moon', uniq: 'The only world known to host life, and the yardstick for every other planet.' },
    moon: { name: 'the Moon', grav: '1.62', gx: 0.165, env: 'Dusty regolith, craters and dark lava plains. Water ice hides in permanently shadowed polar craters. No global magnetic field, and it has moonquakes.', temp: '+117 °C in sunlight, about -178 °C at night, below -230 °C in polar craters', atm: 'Practically none: a very tenuous exosphere containing helium, neon, hydrogen and argon', day: 'Turns once per orbit (27.32 Earth days): one day-night cycle lasts 29.53 Earth days, and the same face always looks at Earth', moons: 'It is Earth’s moon', uniq: 'Gravity so low you could jump about six times higher. It raises Earth’s tides.' },
    mars: { name: 'Mars', grav: '3.7', gx: 0.378, env: 'Cold desert of iron-oxide dust (why it looks red). Olympus Mons is about 22 km tall, Valles Marineris runs about 4,000 km, and ancient river valleys prove liquid water once flowed. Global dust storms. Only patchy remnant magnetism.', temp: 'Mean temperature -65 °C: about -125 °C at the poles in winter, up to 20 °C on summer days at the equator', atm: '95.1% carbon dioxide, 2.59% nitrogen, 1.94% argon and 0.16% oxygen; pressure is only about 0.6% of Earth’s', day: '24 h 42 min day, 687 Earth-day year', moons: '2 small moons, Phobos and Deimos', uniq: 'It once had lakes and rivers and may have hosted life. Polar caps of water ice and CO2 ice.' },
    mercury: { name: 'Mercury', grav: '3.7', gx: 0.378, env: 'A scorched, cratered rock with a huge iron core (about 85% of its radius). Water ice hides in permanently shadowed polar craters.', temp: 'Mean temperature 167 °C; up to about +430 °C by day and -180 °C by night: the biggest swing of any planet', atm: 'Almost none: a surface-bounded exosphere, essentially a vacuum, with traces of sodium, magnesium and oxygen', day: 'One sunrise to the next takes 176 Earth days; a year is only 88 days', moons: 'No moons, no rings', uniq: 'Smallest planet and fastest orbit. Its magnetic field is only about 1% as strong as Earth’s.' },
    venus: { name: 'Venus', grav: '8.9', gx: 0.908, env: 'Volcanic plains under permanent cloud. No liquid water and no global magnetic field. Landers have survived only minutes to about two hours.', temp: '464 °C everywhere, day and night: hot enough to melt lead', atm: '96.5% carbon dioxide and 3.5% nitrogen, beneath clouds of sulfuric acid. Surface pressure is about 92 times Earth’s, like 900 m under the ocean', day: 'One sunrise to the next takes about 117 Earth days; its rotation takes 243 days, longer than its 225-day year, and it spins backward', moons: 'No moons, no rings', uniq: 'Hottest planet, even though Mercury is closer. A runaway greenhouse effect.' },
    jupiter: { name: 'Jupiter', grav: '23.1', gx: 2.357, env: 'A gas giant with no solid surface: hydrogen and helium getting denser until it becomes liquid metallic hydrogen. Storms bigger than Earth, and the Great Red Spot has been watched for centuries.', temp: 'Mean temperature -110 °C; about -108 °C at the 1-bar level, thousands of degrees deeper down', atm: '89.8% hydrogen and 10.2% helium, with trace methane and ammonia clouds', day: '9 h 54 min day (fastest spinner); a year lasts 11.9 Earth years', moons: '95 known moons, including Io (most volcanic world), Europa (ocean under the ice), Ganymede and Callisto, plus faint rings', uniq: 'More than twice the mass of all other planets combined. The strongest magnetic field of any planet traps radiation belts that fry electronics.', gnote: 'measured at the cloud tops; there is nothing to stand on' },
    saturn: { name: 'Saturn', grav: '9.0', gx: 0.918, env: 'A gas giant with no solid surface, wrapped in rings of mostly water-ice chunks from dust grains to house-sized boulders. Winds reach about 1,800 km/h.', temp: 'Mean temperature -140 °C; about -139 °C at the 1-bar level', atm: '96.3% hydrogen and 3.25% helium, with traces of methane and ammonia', day: '10 h 42 min day; a year lasts 29.4 Earth years', moons: '274 known moons: Titan has a thick nitrogen atmosphere and methane lakes, Enceladus sprays water from an underground ocean', uniq: 'Less dense than water: it would float in a big enough bathtub. A hexagon-shaped storm sits at its north pole.', gnote: 'measured at the cloud tops; there is nothing to stand on' },
    uranus: { name: 'Uranus', grav: '8.7', gx: 0.888, env: 'An ice giant: a deep slush of water, methane and ammonia ices around a small rocky core. Methane in the atmosphere absorbs red light, giving the blue-green color.', temp: 'Mean temperature -195 °C; about -197 °C at 1 bar and -220 °C at 0.1 bar', atm: '82.5% hydrogen, 15.2% helium and 2.3% methane', day: '17 h 12 min day; a year lasts 84 Earth years', moons: '28 known moons and 13 faint rings', uniq: 'Tipped on its side (98 degrees), so each pole gets 42 years of sunlight and then 42 years of darkness. Its magnetic field is tilted about 59 degrees from its spin axis.', gnote: 'measured at the cloud tops; there is nothing to stand on' },
    neptune: { name: 'Neptune', grav: '11.0', gx: 1.122, env: 'An ice giant with the fastest winds in the Solar System, over 2,000 km/h, and dark storm spots that come and go.', temp: 'Mean temperature -200 °C; about -201 °C at 1 bar and -218 °C at 0.1 bar', atm: '80.0% hydrogen, 19.0% helium and 1.5% methane', day: '16 h 06 min day; a year lasts 165 Earth years', moons: '16 known moons and faint rings. Triton orbits backward, a captured Kuiper Belt world with nitrogen geysers', uniq: 'Found with mathematics in 1846 before anyone saw it. Sunlight is about 1/900 of Earth’s.', gnote: 'measured at the cloud tops; there is nothing to stand on' },
    sun: { name: 'the Sun', grav: '274.0', gx: 27.959, env: 'A ball of glowing plasma with no solid surface to land on. It holds 99.86% of the Solar System’s mass and fuses hydrogen into helium in its core.', temp: '5,500 °C at the visible surface, 1 to 3 million °C in the corona, about 15.7 million °C in the core', atm: 'The photosphere is 90.965% hydrogen and 8.889% helium by major elements; above it lie the chromosphere and corona, a plasma that streams as the solar wind', day: 'Rotates in 609.12 hours (about 25.4 days at 16° latitude); the rate varies with latitude', moons: 'Eight planets orbit it', uniq: 'Sunlight delivers 1,361 W per square meter at Earth. Flares and coronal mass ejections can disable electronics.', gnote: 'if you could stand on it' }
  },
  sunDive: {
    lines: [
      ['<b>Transfer burn.</b> To fall toward the Sun you must cancel Earth’s 29.8 km/s sideways orbital speed. That takes about 24 km/s from low Earth orbit. Leaving the Solar System needs only about 9. You burn everything you have.', ''],
      ['<b>0.39 AU</b> (Mercury’s orbit): sunlight is 6.5 times stronger than at Earth. The solar wings overheat and the radiators cannot keep up.', 'bad'],
      ['<b>0.10 AU:</b> sunlight is 100 times stronger (about 136 kW per square meter). Surfaces reach roughly 1,000 °C. Aluminium melts at 660 °C, so antennas warp and the signal dies.', 'bad'],
      ['<b>About 6 million km above the surface:</b> this is the closest NASA’s Parker Solar Probe has flown, and it needs a 11.5 cm carbon-composite shield and many Venus flybys to get there. Your craft has no such shield. The corona around you is over a million degrees.', 'bad'],
      ['<b>1.5 million km:</b> sunlight is thousands of times stronger than at Earth. Metals melt and begin to boil, tanks vent, electronics are cooked by radiation.', 'bad']
    ],
    boom: '<b>BOOM.</b> The propellant tanks rupture and your spacecraft is torn apart and vaporized, long before it reaches the Sun. <b>You can’t enter the Sun.</b> It has no surface, only plasma, and nothing we can build survives its heat.',
    why: [
      'Energy: falling into the Sun needs about 24 km/s of delta-v from low Earth orbit, because Earth moves sideways at 29.8 km/s and you must cancel it. Escaping the Solar System needs only about 9 km/s, so the Sun is harder to hit than to leave.',
      'Heat: sunlight intensity grows with the inverse square of distance. At the Sun’s surface it is about 46,000 times Earth’s, and the corona is a million degrees. No material we have survives that for long.',
      'No surface: the Sun is a ball of plasma. There is nothing to land on or orbit at a low altitude.',
      'Radiation: flares and coronal mass ejections fry electronics, even for hardened designs.',
      'What real missions do: Parker Solar Probe uses a carbon-composite shield and many Venus flybys to brake, and still only skims the corona.'
    ]
  },
  helpHtml: `
    <p><b>Four stages:</b> 1. Objective (mission, orbit, launcher) &rarr; 2. Build (assemble spacecraft) &rarr; 3. Launch (live simulation &amp; mid-flight decisions) &rarr; 4. Debrief (engineering report).</p>
    <p><b>Spacecraft assembly:</b> Click a part on the left palette (or drag it onto a glowing attachment node) to build your stack. Select any placed part to Rotate (<code>R</code>), Flip (<code>F</code>), or Delete.</p>
    <p><b>Live NASA space weather:</b> APOGEE fetches recent solar flare &amp; CME telemetry from NASA DONKI to set radiation conditions and mid-flight anomalies.</p>
    <p><b>Center of mass &amp; thrust:</b> Keep the yellow Center of Mass aligned with the dashed green engine thrust line so the rocket does not tumble.</p>
    <p><b>Six resources:</b> Mass, Power, Budget, Data, Comms, and Time. Green = healthy reserve, Amber = thin reserve, Red = critical failure.</p>
    <p><b>Career progression:</b> Earth, the Moon, and Mars start open. Safe arrivals unlock Venus, Jupiter, Saturn, Uranus, Neptune, Mercury, and the Sun. Progress saves automatically in your browser.</p>
    <p><b>Manual burns:</b> During launch you can fly two burns yourself: the departure burn that sends you on your way, and the orbit insertion burn when you arrive. Hold the button (or Space) and let go inside the green zone. The insertion zone is narrower, so it is harder. A clean pair adds up to 6% extra science in total. Press Auto-pilot to skip one burn, or Auto-pilot all burns to skip both: no bonus, no penalty. The result never depends on luck.</p>
    <p><b>Pause, resume, restart:</b> While you fly, the Flight menu in the header lets you pause (press <code>P</code> to pause or resume), resume, or restart the flight from lift-off with the same design. If you pause while holding a burn, the burn starts over when you resume.</p>
    <p><b>How a mission ends:</b> <b>Mission accomplished</b> means you reached orbit <i>and</i> returned at least the baseline science. <b>Partial success</b> means you reached orbit and met the minimum (threshold) science, but fell short of the baseline. <b>Mission failed</b> means you never arrived, or arrived but returned less than the minimum. Only Mission accomplished plays the victory music.</p>
    <p><b>Stars:</b> 1&#9733; partial success, 2&#9733; meet baseline science, 3&#9733; earn all four role sign-offs and spend under 85% of budget.</p>
  `
};
