// milestones.js — Zone definitions and mission data for Daily Space Journey

const AU_TO_KM    = 149597870.7;
const MAX_SCALE_AU = 121.6; // Heliopause — progress bar scale reference

// ─── NON-LINEAR PACE CURVE ────────────────────────────────────────────────────
// Each entry is [day, AU]. The probe moves slowly through the richly-documented
// Earth neighbourhood and Mars, then accelerates through the outer solar system.
//
// Approximate zone timing:
//   LEO (0–0.003 AU)      ≈ days  0–10  (Moon passed on day ~9)
//   Cislunar (–0.01 AU)   ≈ days 10–25
//   Inner solar (–1 AU)   ≈ days 25–70  (~2 months to Earth–Sun distance)
//   Earth–Sun / pre-Mars  ≈ days 70–133
//   Mars territory        ≈ days 133–200 (~2 months of rover/orbiter content)
//   Asteroid Belt         ≈ days 200–255
//   Jupiter               ≈ days 255–300
//   Saturn                ≈ days 300–333
//   Uranus / Neptune      ≈ days 333–358  (outer giants blur past)
//   Pluto                 ≈ day  365      (exactly 1 year)
//   Heliopause            ≈ day  510      (~17 months)

const PACE_CURVE = [
  [0,    0      ],
  [10,   0.003  ],  // exit LEO
  [25,   0.01   ],  // past Moon + L2
  [70,   1.0    ],  // Earth–Sun distance
  [130,  1.52   ],  // Mars orbital distance
  [200,  3.5    ],  // asteroid belt centre
  [255,  5.2    ],  // Jupiter
  [300,  9.5    ],  // Saturn
  [333,  19.2   ],  // Uranus
  [353,  30.1   ],  // Neptune
  [365,  39.5   ],  // Pluto — exactly 1 year
  [510,  121.6  ],  // Heliopause
];

function daysToAU(days) {
  if (days <= 0) return 0;
  for (let i = 1; i < PACE_CURVE.length; i++) {
    const [d0, au0] = PACE_CURVE[i - 1];
    const [d1, au1] = PACE_CURVE[i];
    if (days <= d1) {
      const t = (days - d0) / (d1 - d0);
      return au0 + t * (au1 - au0);
    }
  }
  // Beyond last waypoint — extrapolate from final segment
  const [d0, au0] = PACE_CURVE[PACE_CURVE.length - 2];
  const [d1, au1] = PACE_CURVE[PACE_CURVE.length - 1];
  return au1 + ((days - d1) / (d1 - d0)) * (au1 - au0);
}

function auToDays(targetAU) {
  if (targetAU <= 0) return 0;
  for (let i = 1; i < PACE_CURVE.length; i++) {
    const [d0, au0] = PACE_CURVE[i - 1];
    const [d1, au1] = PACE_CURVE[i];
    if (targetAU <= au1) {
      const t = (targetAU - au0) / (au1 - au0);
      return d0 + t * (d1 - d0);
    }
  }
  const [d0, au0] = PACE_CURVE[PACE_CURVE.length - 2];
  const [d1, au1] = PACE_CURVE[PACE_CURVE.length - 1];
  return d1 + ((targetAU - au1) / (au1 - au0)) * (d1 - d0);
}

// ─── ZONES ───────────────────────────────────────────────────────────────────

const ZONES = [
  {
    id: 'leo',
    name: 'Low Earth Orbit',
    icon: '🛰️',
    color: '#4a9eff',
    range: [0, 0.003],
    description: 'Your probe launches into the realm of satellites and space stations — 200–2,000 km above Earth, where the thin upper atmosphere still drags on spacecraft.',
    nasaQuery: 'International Space Station earth orbit astronaut',
    quote: { text: 'Looking outward to the blackness of space, speckled with the glory of a universe of lights, I saw majesty — but no welcome.', author: 'Yuri Gagarin, first human in space, April 12, 1961' },
    facts: [
      'The ISS orbits at 408 km altitude, completing a full orbit every 92 minutes.',
      'At this altitude you witness 16 sunrises and 16 sunsets every 24 hours.',
      'The Hubble Space Telescope orbits at 547 km — well within Low Earth Orbit.',
      'More than 600 humans have visited space; the vast majority never left this zone.'
    ]
  },
  {
    id: 'cislunar',
    name: 'Cislunar Space',
    icon: '🌙',
    color: '#c0c8d8',
    range: [0.003, 0.015],
    description: 'The vast region between Earth and the Moon — a gravitational crossroads where Earth's pull gives way to the Moon's. The Apollo missions crossed it in three days.',
    nasaQuery: 'Moon lunar far side Apollo cislunar',
    quote: { text: 'That\'s one small step for [a] man, one giant leap for mankind.', author: 'Neil Armstrong, lunar surface, July 20, 1969' },
    facts: [
      'The Moon is 384,400 km from Earth — your probe passes this milestone on Day 1.',
      'Apollo 11 took 3 days and 3 hours to travel from Earth to the Moon in 1969.',
      'The James Webb Space Telescope sits at the L2 point — 1.5 million km from Earth.',
      'China's Chang'e 4 became the first spacecraft to land on the lunar far side in January 2019.'
    ]
  },
  {
    id: 'inner_solar',
    name: 'Inner Solar System',
    icon: '🌡️',
    color: '#fbbf24',
    range: [0.015, 0.8],
    description: 'The hot inner region baked by intense solar radiation, where Venus and Mercury orbit. Parker Solar Probe dives closer to the Sun than any craft before it.',
    nasaQuery: 'Venus Mercury inner solar system BepiColombo Parker Solar Probe',
    quote: { text: 'Somewhere, something incredible is waiting to be known.', author: 'Carl Sagan' },
    facts: [
      'Venus has a surface temperature of 465 °C — hotter than Mercury despite being further from the Sun.',
      'Parker Solar Probe holds the record for closest approach to the Sun: just 6.2 million km.',
      'BepiColombo, a joint ESA/JAXA mission, will enter Mercury orbit in 2025.',
      'Mercury\'s day is longer than its year — it rotates more slowly than it orbits the Sun.'
    ]
  },
  {
    id: 'earth_sun',
    name: 'Earth–Sun Region',
    icon: '☀️',
    color: '#f97316',
    range: [0.8, 1.6],
    description: 'You've crossed 1 Astronomical Unit — the Earth–Sun distance that defines our cosmic ruler. The solar wind streams past at 400–800 km/s.',
    nasaQuery: 'Sun corona solar wind SOHO heliosphere',
    quote: { text: 'The Sun, with all those planets revolving around it, can still ripen a bunch of grapes as if it had nothing else in the universe to do.', author: 'Galileo Galilei' },
    facts: [
      '1 AU = 149,597,870 km — the yardstick of our solar system.',
      'Light takes 8 minutes and 20 seconds to travel from the Sun to Earth.',
      'SOHO has monitored the Sun continuously since 1996 and discovered over 4,000 comets.',
      'The solar wind carves a protective bubble around our solar system called the heliosphere.'
    ]
  },
  {
    id: 'mars',
    name: 'Mars Territory',
    icon: '🔴',
    color: '#ef4444',
    range: [1.6, 3.5],
    description: 'The Red Planet's domain — a world where rovers rove, landers listen for marsquakes, and orbiters map ancient river valleys carved billions of years ago.',
    nasaQuery: 'Mars surface Perseverance Curiosity rover Jezero crater',
    quote: { text: 'The surface of the Earth is the shore of the cosmic ocean. From it we have learned most of what we know. Recently, we have waded a little out to sea — enough to dampen our toes.', author: 'Carl Sagan' },
    facts: [
      'Olympus Mons on Mars is the tallest volcano in the solar system at 21.9 km.',
      'A Martian day (sol) is 24 hours and 37 minutes — just slightly longer than Earth\'s.',
      'Perseverance has collected rock samples for a planned future return to Earth.',
      'Ingenuity helicopter made over 70 powered flights on Mars — the first on another planet.'
    ]
  },
  {
    id: 'asteroid_belt',
    name: 'Asteroid Belt',
    icon: '☄️',
    color: '#b45309',
    range: [3.5, 5.2],
    description: 'A ring of rocky debris left over from the solar system's formation — surprisingly sparse. You could fly through it without seeing a single asteroid.',
    nasaQuery: 'asteroid belt Ceres Vesta Dawn spacecraft',
    quote: { text: 'In our obscurity — in all this vastness — there is no hint that help will come from elsewhere to save us from ourselves.', author: 'Carl Sagan, Pale Blue Dot' },
    facts: [
      'Despite millions of asteroids, the belt is 99.9% empty space.',
      'Ceres contains roughly one-third of all the mass in the entire Asteroid Belt.',
      'NASA\'s Dawn is the only spacecraft to have orbited two different extraterrestrial bodies.',
      'Hayabusa2 returned samples from asteroid Ryugu in 2020 — they contained organic molecules.'
    ]
  },
  {
    id: 'jupiter',
    name: 'Jupiter System',
    icon: '🪐',
    color: '#d97706',
    range: [5.2, 8.5],
    description: 'The king of planets — a gas giant so large that 1,300 Earths could fit inside it, with 95 moons and the most powerful magnetic field of any planet.',
    nasaQuery: 'Jupiter Juno great red spot Galilean moons Io Europa',
    quote: { text: 'We have lingered too long on the shores of the cosmic ocean. We are ready at last to set sail for the stars.', author: 'Carl Sagan' },
    facts: [
      'Jupiter\'s Great Red Spot is a storm that has raged for at least 350 years.',
      'Io has over 400 active volcanoes — the most geologically active body in the solar system.',
      'Europa\'s subsurface ocean may contain twice as much water as all of Earth\'s oceans.',
      'NASA\'s Juno has been orbiting Jupiter since 2016, revealing its turbulent interior.'
    ]
  },
  {
    id: 'saturn',
    name: 'Saturn System',
    icon: '💫',
    color: '#ca8a04',
    range: [8.5, 12.5],
    description: 'The jewel of the solar system — Saturn's rings span 282,000 km yet are only 10–100 metres thick. Cassini spent 13 years mapping this magnificent system.',
    nasaQuery: 'Saturn rings Cassini Titan moon Enceladus',
    quote: { text: 'The rings of Saturn are among the most beautiful sights in the solar system; no photograph does them justice.', author: 'Carl Sagan' },
    facts: [
      'Saturn\'s rings are made mostly of ice and rock ranging from dust grains to house-sized boulders.',
      'Titan is the only moon in the solar system with a thick atmosphere and liquid lakes on its surface.',
      'Enceladus spouts jets of water vapour and ice — evidence of a liquid ocean beneath the ice shell.',
      'Saturn is the least dense planet — it would float on water if you had a large enough ocean.'
    ]
  },
  {
    id: 'uranus_neptune',
    name: 'Ice Giants',
    icon: '🔵',
    color: '#0891b2',
    range: [12.5, 32.0],
    description: 'Uranus and Neptune — the mysterious ice giants visited only once, by Voyager 2 in 1986 and 1989. Both harbour bizarre magnetic fields and extreme storms.',
    nasaQuery: 'Uranus Neptune ice giant Voyager 2 rings',
    quote: { text: 'The cosmos is within us. We are made of star-stuff. We are a way for the universe to know itself.', author: 'Carl Sagan' },
    facts: [
      'Uranus rotates on its side — its axial tilt is 97.8°, likely from a massive ancient collision.',
      'Neptune\'s winds reach 2,100 km/h — the fastest sustained winds in the solar system.',
      'Triton, Neptune\'s largest moon, orbits backwards and will eventually be torn apart by tidal forces.',
      'Voyager 2 is the only spacecraft to have visited both Uranus and Neptune.'
    ]
  },
  {
    id: 'kuiper',
    name: 'Kuiper Belt & Pluto',
    icon: '❄️',
    color: '#7dd3fc',
    range: [32.0, 55.0],
    description: 'The icy frontier — a vast ring of frozen worlds including Pluto, Eris, and Arrokoth, remnants from the solar system's birth 4.5 billion years ago.',
    nasaQuery: 'Pluto New Horizons Kuiper belt heart Tombaugh Regio',
    quote: { text: 'Pluto is a complex and fascinating place with mountains of water ice and flowing plains of nitrogen ice. The solar system has surprised us once again.', author: 'Alan Stern, New Horizons Principal Investigator' },
    facts: [
      'Pluto\'s heart-shaped nitrogen ice plain, Tombaugh Regio, stretches over 1,600 km across.',
      'New Horizons flew past Pluto in July 2015 after a 9.5-year, 4.8 billion km journey.',
      'Arrokoth is the most distant Solar System object ever explored up close by a spacecraft.',
      'The Kuiper Belt contains over 100,000 objects larger than 100 km in diameter.'
    ]
  },
  {
    id: 'heliosphere',
    name: 'Heliosphere Edge',
    icon: '🌟',
    color: '#818cf8',
    range: [55.0, 121.6],
    description: 'The outer boundary of our Sun\'s influence — where the solar wind slows and piles up against the interstellar medium. Voyager 1 crossed here in 2012.',
    nasaQuery: 'Voyager 1 heliosphere termination shock outer solar system',
    quote: { text: 'Voyager did things we never planned, went places we never thought we\'d go, and it is the gift that keeps on giving.', author: 'Edward Stone, Voyager Project Scientist' },
    facts: [
      'The heliosphere shields our solar system from most of the interstellar cosmic radiation.',
      'Voyager 1 crossed the termination shock at about 94 AU in 2004.',
      'The heliopause at ~122 AU is where solar wind pressure equals interstellar pressure.',
      'New Horizons continues outward and will reach the heliosheath in the 2040s.'
    ]
  },
  {
    id: 'interstellar',
    name: 'Interstellar Space',
    icon: '⭐',
    color: '#c084fc',
    range: [121.6, Infinity],
    description: 'Beyond the solar system — only Voyager 1 and Voyager 2 have reached this realm, drifting among the stars carrying humanity\'s message to the cosmos.',
    nasaQuery: 'Voyager interstellar space pale blue dot Carl Sagan',
    quote: { text: 'Look again at that dot. That\'s here. That\'s home. That\'s us. On it everyone you love, everyone you know, everyone you ever heard of lived out their lives.', author: 'Carl Sagan, Pale Blue Dot, 1994' },
    facts: [
      'Voyager 1 (launched 1977) is over 160 AU from Earth — the most distant human-made object.',
      'The Pale Blue Dot photograph was taken by Voyager 1 at 6 billion km from Earth in 1990.',
      'Voyager 1 carries a golden record with sounds and images of life on Earth.',
      'The nearest star system, Alpha Centauri, is 4.37 light-years (276,000 AU) away.'
    ]
  }
];

// ─── MILESTONES ───────────────────────────────────────────────────────────────

const MILESTONES = [
  {
    name: 'Moon',
    distanceAU: 0.00257,
    emoji: '🌙',
    mission: {
      name: 'Apollo 11',
      agency: 'NASA',
      date: 'July 20, 1969',
      type: 'Landing',
      desc: 'First crewed landing on the Moon. Neil Armstrong and Buzz Aldrin spent 2 hours 31 minutes on the lunar surface while Michael Collins orbited above.',
      imageQuery: 'Apollo 11 lunar surface moon astronaut Neil Armstrong'
    }
  },
  {
    name: 'L2 Lagrange Point',
    distanceAU: 0.01,
    emoji: '🔭',
    mission: {
      name: 'James Webb Space Telescope',
      agency: 'NASA / ESA / CSA',
      date: 'January 24, 2022',
      type: 'Observatory',
      desc: 'The most powerful space telescope ever built, JWST observes the universe in infrared from the stable L2 point, 1.5 million km from Earth.',
      imageQuery: 'James Webb Space Telescope JWST deep field galaxy nebula'
    }
  },
  {
    name: 'Venus',
    distanceAU: 0.28,
    emoji: '🌡️',
    mission: {
      name: 'BepiColombo',
      agency: 'ESA / JAXA',
      date: 'October 15, 2020 (first flyby)',
      type: 'Flyby en route to Mercury',
      desc: 'ESA and JAXA\'s joint Mercury mission performed six Venus flybys using the planet\'s gravity as a slingshot to slow down and reach Mercury.',
      imageQuery: 'BepiColombo Venus flyby spacecraft ESA JAXA'
    }
  },
  {
    name: '1 AU — Earth–Sun Distance',
    distanceAU: 1.0,
    emoji: '☀️',
    mission: {
      name: 'Parker Solar Probe',
      agency: 'NASA',
      date: 'Launched August 12, 2018',
      type: 'Solar orbiter',
      desc: 'Parker Solar Probe holds the record for the closest-ever approach to the Sun — just 6.2 million km — and the fastest speed ever achieved by a spacecraft: 692,000 km/h.',
      imageQuery: 'Parker Solar Probe Sun corona solar wind NASA'
    }
  },
  {
    name: 'Mars',
    distanceAU: 1.52,
    emoji: '🔴',
    mission: {
      name: 'Perseverance Rover',
      agency: 'NASA',
      date: 'February 18, 2021',
      type: 'Mars lander / rover',
      desc: 'Perseverance landed in Jezero Crater — an ancient lake bed — and began collecting rock samples for potential return to Earth, while Ingenuity helicopter flew alongside.',
      imageQuery: 'Perseverance rover Mars Jezero crater surface NASA'
    }
  },
  {
    name: 'Asteroid Belt',
    distanceAU: 2.2,
    emoji: '☄️',
    mission: {
      name: 'Dawn',
      agency: 'NASA',
      date: 'July 16, 2011 — Vesta arrival',
      type: 'Orbiter',
      desc: 'NASA\'s Dawn is the only spacecraft to have orbited two separate extraterrestrial bodies — Vesta (2011–2012) and Ceres (2015–2018), the largest objects in the Asteroid Belt.',
      imageQuery: 'Dawn spacecraft asteroid Vesta Ceres NASA'
    }
  },
  {
    name: 'Ceres',
    distanceAU: 2.77,
    emoji: '🪨',
    mission: {
      name: 'Dawn at Ceres',
      agency: 'NASA',
      date: 'March 6, 2015',
      type: 'Orbiter',
      desc: 'Dawn entered orbit around Ceres — the largest object in the Asteroid Belt — revealing mysterious bright spots in Occator Crater, later identified as salt deposits.',
      imageQuery: 'Ceres bright spots Occator crater Dawn spacecraft NASA'
    }
  },
  {
    name: 'Jupiter',
    distanceAU: 5.2,
    emoji: '🪐',
    mission: {
      name: 'Juno',
      agency: 'NASA',
      date: 'July 4, 2016',
      type: 'Polar orbiter',
      desc: 'Juno entered orbit around Jupiter to study its deep interior, powerful magnetic field, and auroras. Its camera JunoCam has returned breathtaking close-up views of the Great Red Spot.',
      imageQuery: 'Juno spacecraft Jupiter great red spot close up JunoCam'
    }
  },
  {
    name: 'Saturn',
    distanceAU: 9.5,
    emoji: '💫',
    mission: {
      name: 'Cassini–Huygens',
      agency: 'NASA / ESA / ASI',
      date: 'July 1, 2004',
      type: 'Orbiter + Titan lander',
      desc: 'Cassini orbited Saturn for 13 years, discovering water plumes on Enceladus and delivering the Huygens probe to Titan\'s surface. Its Grand Finale ended in a deliberate dive into Saturn in 2017.',
      imageQuery: 'Cassini Saturn rings Titan Enceladus plumes NASA ESA'
    }
  },
  {
    name: 'Uranus',
    distanceAU: 19.2,
    emoji: '🔵',
    mission: {
      name: 'Voyager 2',
      agency: 'NASA',
      date: 'January 24, 1986',
      type: 'Flyby',
      desc: 'Voyager 2 remains the only spacecraft to have visited Uranus, discovering 10 new moons and 2 new rings in just 5.5 hours of close approach.',
      imageQuery: 'Voyager 2 Uranus blue ice giant moon rings NASA'
    }
  },
  {
    name: 'Neptune',
    distanceAU: 30.1,
    emoji: '💙',
    mission: {
      name: 'Voyager 2',
      agency: 'NASA',
      date: 'August 25, 1989',
      type: 'Flyby',
      desc: 'Voyager 2 performed humanity\'s only flyby of Neptune, revealing the Great Dark Spot, winds of 2,100 km/h, and geysers on the moon Triton.',
      imageQuery: 'Voyager 2 Neptune great dark spot Triton moon NASA'
    }
  },
  {
    name: 'Pluto',
    distanceAU: 39.5,
    emoji: '❄️',
    mission: {
      name: 'New Horizons',
      agency: 'NASA',
      date: 'July 14, 2015',
      type: 'Flyby',
      desc: 'After 9.5 years and 4.8 billion km, New Horizons flew past Pluto at 14 km/s, revealing the iconic heart-shaped Tombaugh Regio — a nitrogen ice plain the size of Texas and Oklahoma combined.',
      imageQuery: 'New Horizons Pluto heart Tombaugh Regio nitrogen ice NASA'
    }
  },
  {
    name: 'Heliopause',
    distanceAU: 121.6,
    emoji: '🌟',
    mission: {
      name: 'Voyager 1',
      agency: 'NASA',
      date: 'August 25, 2012',
      type: 'Interstellar probe',
      desc: 'Voyager 1 became the first human-made object to cross the heliopause into interstellar space — 35 years after its launch. It continues to transmit data as it drifts among the stars.',
      imageQuery: 'Voyager 1 interstellar space heliosphere pale blue dot NASA'
    }
  }
];

// ─── SOLAR SYSTEM MAP DATA ────────────────────────────────────────────────────

const SOLAR_PLANETS = [
  { name: 'Mercury', au: 0.387, angleDeg: 220, color: '#aaaaaa', r: 2.5 },
  { name: 'Venus',   au: 0.723, angleDeg: 148, color: '#e8c870', r: 4.5 },
  { name: 'Earth',   au: 1.000, angleDeg: 258, color: '#4a9eff', r: 5.0 },
  { name: 'Mars',    au: 1.524, angleDeg: 196, color: '#c04030', r: 3.5 },
  { name: 'Jupiter', au: 5.203, angleDeg: 128, color: '#c8a060', r: 10  },
  { name: 'Saturn',  au: 9.537, angleDeg: 265, color: '#d4b07a', r: 8   },
  { name: 'Uranus',  au: 19.19, angleDeg: 42,  color: '#7de8e8', r: 6   },
  { name: 'Neptune', au: 30.07, angleDeg: 208, color: '#3060f0', r: 5.5 },
  { name: 'Pluto',   au: 39.48, angleDeg: 104, color: '#90a8b8', r: 2.5 },
];

// Probe travels in the upper-right direction (clear of all planet angles above)
const PROBE_ANGLE_RAD = (315 * Math.PI) / 180; // upper-right in canvas coords

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function getZone(distanceAU) {
  return ZONES.find(z => distanceAU >= z.range[0] && distanceAU < z.range[1]) || ZONES[ZONES.length - 1];
}

function getNextMilestone(distanceAU) {
  return MILESTONES.find(m => m.distanceAU > distanceAU) || null;
}

function getNearbyMilestone(distanceAU) {
  // "nearby" = within ±3 days of a milestone in curve-time
  const currentDay = auToDays(distanceAU);
  return MILESTONES.find(m => Math.abs(auToDays(m.distanceAU) - currentDay) <= 3) || null;
}

function getProgressPercent(distanceAU) {
  return Math.min(Math.sqrt(Math.max(distanceAU, 0) / MAX_SCALE_AU) * 100, 100);
}

function formatKM(km) {
  if (km >= 1e9)  return (km / 1e9).toFixed(2)  + 'B km';
  if (km >= 1e6)  return (km / 1e6).toFixed(2)  + 'M km';
  if (km >= 1e3)  return Math.round(km / 1e3).toLocaleString() + ',000 km';
  return Math.round(km) + ' km';
}
