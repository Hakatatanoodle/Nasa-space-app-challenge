/* File: js/content.js
 * Owner: Person C (Yochan)
 * AI-assisted: YES — Gemini, 2026-11-14; Claude, 2026-11-14. Reviewed by a human: NO.
 * Sources used: NASA_CUBESAT101, JPL_CML
 */

export const CONTENT = {
  appName: 'APOGEE',
  tagline: 'Every kilogram is a decision.',
  bgVideo: 'assets/bg/space.mp4',
  bgCredit: '',
  disclaimer: 'Mission design simulation — simplified engineering model. Reference tags shown per parameter.',
  stageNames: ['Objective', 'Build', 'Launch', 'Debrief'],
  subResources: ['Delta-v', 'Battery', 'Ion power'],
  outcomeLabels: {
    success: 'Mission accomplished',
    partial: 'Partial success',
    lost: 'Mission lost'
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
    mars: 'Map Mars and find where water hides.'
  },
  orbitDescriptions: {
    'Low polar orbit': 'Sharp views, short shadows, limited ground-station contact windows.',
    'Medium orbit': 'Wider view and longer contact, with higher radiation exposure.',
    Geostationary: 'Continuous contact and sunlight, high delta-v requirement, distant view.',
    'Elliptical orbit': 'Balanced surface resolution and ground-station contact.',
    'Halo-type orbit': 'Low station-keeping cost and high contact, distant view.',
    'Low orbit': 'Sharp resolution, costly insertion, weak solar flux at Mars.',
    'High orbit': 'Lower insertion delta-v, distant observation geometry.'
  },
  partDescriptions: {
    chem: 'Strong and quick, thirsty for fuel.',
    nuclear: 'More than twice the efficiency, heavy and costly.',
    ion: 'Sips fuel, takes months, requires 1500 W of solar power.',
    bus_std: 'Low mass and cost; susceptible to radiation aging.',
    bus_rad: 'Radiation-shielded avionics for harsher orbits.',
    bus_red: 'Shielded electronics plus redundant flight computer.'
  },
  eventText: {
    solar_flare: {
      n: 'Solar flare',
      txt: 'This orbit sits inside harsh radiation, and a burst of charged particles hits your spacecraft.',
      immT: 'Your radiation-hardened bus shrugs off the particle surge.',
      hitT: 'Without a hardened bus, the electronics go into safe mode.',
      fix: 'Choose the hardened bus.'
    },
    ground_outage: {
      n: 'Ground station outage',
      txt: 'Contact time with Earth is short here, so an outage of the receiving antennas hurts.',
      immT: 'Your onboard data recorder buffers all observations until contact returns.',
      hitT: 'With no data recorder, observations are dropped while Earth cannot listen.',
      fix: 'Add a data recorder.'
    },
    computer_glitch: {
      n: 'Computer glitch',
      txt: 'Mars is months from help, and the primary flight computer reboots mid-observation.',
      immT: 'Your redundant backup computer takes over seamlessly.',
      hitT: 'With no backup computer, the ship restarts and loses observations.',
      fix: 'Choose the hardened bus with the backup computer.'
    }
  },
  flightLog: {
    liftoff: '<b>Lift-off.</b> {launcher} carries {massKg} kg. Launch reliability {reliabilityPct}%.',
    tumble: 'Thrust and mass are {offPx} px out of line (limit {limitPx} px). The rocket tumbles off the pad.',
    ascent: 'Orbit insertion nominal. Reliability {reliabilityPct}% will scale your final score.',
    transfer: '<b>Transfer burn.</b> Need {needMs} m/s, spacecraft has {haveMs} m/s.',
    deltav_short: 'Propellant depleted {shortMs} m/s short of target orbit.',
    ion_short: 'Ion thruster power below {needW} W threshold; orbit transfer incomplete.',
    arrival: '<b>Arrived</b> after {days} days. Entering {orbit}.',
    operations: '<b>Operations complete.</b> {returnedPct}% of data downlinked. Science return: <b>{science}</b> / {target} pts.'
  },
  flightFailures: {
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
    dataReturn: 'Data downlink: only {returnedPct}% reached Earth. Upgrade antenna or add data storage.',
    eventLoss: 'Science reduced by {lossPct}%.',
    reliability:
      'Launch reliability {reliabilityPct}% (launcher {launcherPct}% x bus {busPct}%, adjusted by {adjustmentPct} points for thin margins, balance, sign-offs and review). Your final score is multiplied by {reliabilityPct}%.',
    reliabilityFix: ' Fix: turn amber rows green, balance the ship, or pick a more reliable launcher or bus.'
  },
  predictedFlight: {
    heading: 'Predicted flight',
    note: 'No dice: the same design always flies the same way. Change the design to change the result.',
    noEvents: 'No flight events expected in this orbit.',
    eventImmune: 'protected',
    eventHit: 'will cost {lossPct}% science'
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
    MAVEN: 'Elliptical Mars orbiter studying upper-atmosphere loss with a magnetometer.'
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
      fix: 'Add solar wings or remove power-hungry instruments.'
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
      why: 'Transit duration and radiation degradation reduce useful life below mission requirements.',
      fix: 'Select a radiation-hardened bus or a faster propulsion system.'
    },
    'Ion power': {
      why: 'Ion thruster requires 1500 W of electrical power generation.',
      fix: 'Add solar wings until total generation meets 1500 W.'
    }
  },
  helpHtml: `
    <h2 id="help-title">How to play</h2>
    <p><b>Four stages:</b> 1. Objective (mission, orbit, launcher) &rarr; 2. Build (assemble spacecraft) &rarr; 3. Launch (simulation) &rarr; 4. Debrief (engineering report).</p>
    <p><b>Free-form assembly:</b> Drag parts from the left palette onto the glowing attachment nodes, or click/press Enter on a part to auto-attach. Unattached parts glow red and will not launch. Select a part to Rotate (<code>R</code>), Flip (<code>F</code>), or Delete.</p>
    <p><b>Center of mass &amp; thrust:</b> Keep the yellow Center of Mass aligned with the dashed green engine thrust line so the rocket does not tumble.</p>
    <p><b>Six resources:</b> Mass, Power, Budget, Data, Comms, and Time. Green = healthy reserve, Amber = thin reserve (lowers launch reliability and your final score), Red = critical failure.</p>
    <p><b>Design review &amp; trade space:</b> Before launch, a Concept Maturity checklist verifies readiness (80% green required to pass) and shows your predicted flight. No dice: the same design always flies the same way. Save up to 3 candidates to compare trade-offs.</p>
    <p><b>Stars:</b> 1&#9733; survive mission, 2&#9733; meet baseline science, 3&#9733; earn all four role sign-offs and spend under 85% of budget.</p>
    <button type="button" id="x">Start designing</button>
  `
};