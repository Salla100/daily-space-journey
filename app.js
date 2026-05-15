// app.js — Daily Space Journey core logic

const STORAGE_KEY = 'spaceJourney';
const APOD_CACHE_PREFIX = 'apod_cache_';
const IMG_CACHE_PREFIX  = 'nasa_img_';
const IMG_CACHE_TTL     = 7 * 24 * 60 * 60 * 1000; // 7 days

// ─── STATE ───────────────────────────────────────────────────────────────────

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (_) { return null; }
}

function saveState(s) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch (_) {}
}

function createState() {
  const today = todayStr();
  return {
    launchDate: today,
    lastVisit:  today,
    totalDays:  1,
    distanceAU: DAILY_DISTANCE_AU,
    visitLog:   [today],
    v: 1
  };
}

// Returns { state, isFirstVisit, isNewDay }
function processState(raw) {
  if (!raw) {
    const state = createState();
    saveState(state);
    return { state, isFirstVisit: true, isNewDay: false };
  }

  const today = todayStr();
  if (raw.lastVisit === today) {
    return { state: raw, isFirstVisit: false, isNewDay: false };
  }

  raw.lastVisit = today;
  raw.totalDays += 1;
  raw.distanceAU = raw.totalDays * DAILY_DISTANCE_AU;
  if (!raw.visitLog.includes(today)) raw.visitLog.push(today);
  saveState(raw);
  return { state: raw, isFirstVisit: false, isNewDay: true };
}

function calcStreak(visitLog) {
  if (!visitLog || !visitLog.length) return 0;
  const sorted = [...visitLog].sort();
  let streak = 0;
  let check = todayStr();
  for (let i = sorted.length - 1; i >= 0; i--) {
    if (sorted[i] === check) {
      streak++;
      const d = new Date(check);
      d.setUTCDate(d.getUTCDate() - 1);
      check = d.toISOString().slice(0, 10);
    } else if (sorted[i] < check) {
      break;
    }
  }
  return streak;
}

// ─── STARS CANVAS ────────────────────────────────────────────────────────────

function initStars() {
  const canvas = document.getElementById('stars');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let stars = [], raf;

  function size() {
    canvas.width  = window.innerWidth;
    canvas.height = Math.max(document.body.scrollHeight, window.innerHeight);
    build();
  }

  function build() {
    const n = Math.floor(canvas.width * canvas.height / 2800);
    stars = Array.from({ length: Math.min(n, 400) }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.4 + 0.2,
      a: Math.random() * 0.7 + 0.2,
      sp: Math.random() * 0.006 + 0.0008,
      ph: Math.random() * Math.PI * 2
    }));
  }

  function draw(t) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    stars.forEach(s => {
      const tw = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * s.sp * 800 + s.ph));
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${(tw * s.a).toFixed(3)})`;
      ctx.fill();
    });
    raf = requestAnimationFrame(draw);
  }

  window.addEventListener('resize', size);
  size();
  raf = requestAnimationFrame(draw);
}

// ─── NASA APIs ───────────────────────────────────────────────────────────────

async function fetchAPOD() {
  const key = APOD_CACHE_PREFIX + todayStr();
  try {
    const cached = localStorage.getItem(key);
    if (cached) return JSON.parse(cached);
  } catch (_) {}

  try {
    const res = await fetch(
      `https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY&date=${todayStr()}`
    );
    if (!res.ok) throw new Error('APOD ' + res.status);
    const data = await res.json();
    try { localStorage.setItem(key, JSON.stringify(data)); } catch (_) {}
    return data;
  } catch (_) {
    return null;
  }
}

async function fetchNASAImage(query) {
  const key = IMG_CACHE_PREFIX + btoa(encodeURIComponent(query)).slice(0, 24);
  try {
    const cached = localStorage.getItem(key);
    if (cached) {
      const { d, ts } = JSON.parse(cached);
      if (Date.now() - ts < IMG_CACHE_TTL) return d;
    }
  } catch (_) {}

  try {
    const url = `https://images-api.nasa.gov/search?q=${encodeURIComponent(query)}&media_type=image&page_size=10`;
    const res  = await fetch(url);
    if (!res.ok) throw new Error('NASA images ' + res.status);
    const json = await res.json();
    const items = json.collection?.items || [];

    for (const item of items) {
      const link = item.links?.[0]?.href;
      const info = item.data?.[0];
      if (link && info) {
        const d = {
          href:  link,
          title: info.title || '',
          desc:  (info.description || '').replace(/\s+/g, ' ').slice(0, 320)
        };
        try { localStorage.setItem(key, JSON.stringify({ d, ts: Date.now() })); } catch (_) {}
        return d;
      }
    }
    return null;
  } catch (_) {
    return null;
  }
}

// ─── PROGRESS BAR ────────────────────────────────────────────────────────────

function renderProgressBar(distanceAU) {
  const fill    = document.getElementById('progress-fill');
  const pip     = document.getElementById('probe-pip');
  const pipsEl  = document.getElementById('milestone-pips');
  const namesEl = document.getElementById('milestone-name-row');
  if (!fill || !pip) return;

  const pct = getProgressPercent(distanceAU);
  fill.style.width = pct + '%';
  pip.style.left   = `calc(${pct}% - 14px)`;

  pipsEl.innerHTML  = '';
  namesEl.innerHTML = '';

  const SHOW_NAMES = new Set(['Moon', 'Mars', 'Jupiter', 'Saturn', 'Pluto', 'Heliopause']);

  MILESTONES.forEach(m => {
    const mPct = getProgressPercent(m.distanceAU);
    if (mPct > 100) return;

    const reached = distanceAU >= m.distanceAU;

    // Dot on track
    const dot = document.createElement('span');
    dot.className = 'ms-pip' + (reached ? ' reached' : '');
    dot.style.left  = mPct + '%';
    dot.title       = `${m.name} — ${m.distanceAU} AU`;
    dot.textContent = m.emoji;
    pipsEl.appendChild(dot);

    // Name label below track (sparse)
    if (SHOW_NAMES.has(m.name)) {
      const lbl = document.createElement('span');
      lbl.className = 'ms-label' + (reached ? ' reached' : '');
      lbl.style.left  = mPct + '%';
      lbl.textContent = m.name;
      namesEl.appendChild(lbl);
    }
  });
}

// ─── JOURNEY LOG ─────────────────────────────────────────────────────────────

function renderJourneyLog(state) {
  const container = document.getElementById('log-days');
  if (!container) return;
  container.innerHTML = '';

  const today = new Date();
  for (let i = 13; i >= 0; i--) {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() - i);
    const ds = d.toISOString().slice(0, 10);
    const visited  = state.visitLog.includes(ds);
    const isToday  = ds === todayStr();
    const isFuture = ds > todayStr();

    const cell = document.createElement('div');
    cell.className = ['log-day', visited ? 'visited' : 'missed', isToday ? 'today' : '', isFuture ? 'future' : ''].join(' ').trim();
    cell.title = ds;

    const dow = d.toLocaleDateString('en', { weekday: 'short', timeZone: 'UTC' });
    const dom = d.getUTCDate();
    cell.innerHTML = `<span class="ld-dow">${dow[0]}</span><span class="ld-num">${dom}</span><span class="ld-mark">${visited ? '✓' : isFuture ? '' : '·'}</span>`;
    container.appendChild(cell);
  }

  const launchEl = document.getElementById('log-launch-date');
  const totalEl  = document.getElementById('log-total');
  if (launchEl) launchEl.textContent = state.launchDate;
  if (totalEl)  totalEl.textContent  = state.visitLog.length;
}

// ─── NEXT MILESTONE ──────────────────────────────────────────────────────────

function renderNextMilestone(distanceAU) {
  const el = document.getElementById('next-milestone-content');
  if (!el) return;

  const next = getNextMilestone(distanceAU);
  if (!next) {
    el.innerHTML = '<p class="no-next">You have surpassed all known milestones. You are beyond the edge of the solar system. The stars await.</p>';
    return;
  }

  const remAU   = next.distanceAU - distanceAU;
  const remDays = Math.ceil(remAU / DAILY_DISTANCE_AU);
  const remKM   = formatKM(remAU * AU_TO_KM);

  el.innerHTML = `
    <div class="nm-planet">
      <span class="nm-emoji">${next.emoji}</span>
      <span class="nm-name">${next.name}</span>
    </div>
    <div class="nm-stats">
      <div class="nm-stat"><span class="nm-val">${remDays.toLocaleString()}</span><span class="nm-lbl">days at current pace</span></div>
      <div class="nm-stat"><span class="nm-val">${remAU.toFixed(3)}</span><span class="nm-lbl">AU remaining</span></div>
      <div class="nm-stat"><span class="nm-val">${remKM}</span><span class="nm-lbl">distance to go</span></div>
    </div>
    <div class="nm-mission">
      Historical explorer: <strong>${next.mission.name}</strong> (${next.mission.agency}, ${next.mission.date})
    </div>`;
}

// ─── ZONE CARD ───────────────────────────────────────────────────────────────

function renderZone(zone, distanceAU) {
  const card = document.getElementById('zone-card');
  if (!card) return;

  document.getElementById('zone-card-icon').textContent  = zone.icon;
  document.getElementById('zone-card-title').textContent = zone.name.toUpperCase();
  document.getElementById('zone-card-desc').textContent  = zone.description;
  card.style.setProperty('--zone-clr', zone.color);

  const fact = zone.facts[Math.floor(Math.random() * zone.facts.length)];
  document.getElementById('zone-fact-box').innerHTML =
    `<span class="fact-gem">💡</span><span>${fact}</span>`;
}

// ─── DISCOVERY CARD (APOD) ───────────────────────────────────────────────────

async function renderDiscovery(zone) {
  const card = document.getElementById('discovery-card');
  if (!card) return;

  const apod = await fetchAPOD();

  if (apod) {
    const isImg = !apod.media_type || apod.media_type === 'image';
    const imgSrc = apod.hdurl || apod.url || '';
    const copy   = apod.copyright ? `<span class="disc-credit">© ${apod.copyright.trim()}</span>` : '';
    const expl   = (apod.explanation || '').slice(0, 480) + (apod.explanation?.length > 480 ? '…' : '');

    document.getElementById('discovery-date').textContent = apod.date || '';

    card.innerHTML = `
      <div class="disc-image-wrap">
        ${isImg
          ? `<img src="${imgSrc}" alt="${apod.title}" class="disc-image" loading="lazy">`
          : `<div class="disc-video-placeholder">
               <span class="dv-icon">📺</span>
               <p>Today's APOD is a video — <a href="${apod.url}" target="_blank" rel="noopener">watch it here</a></p>
             </div>`
        }
        <div class="disc-overlay">
          <div class="disc-meta">
            <span class="disc-source">NASA APOD · ${apod.date || ''}</span>${copy}
          </div>
          <h3 class="disc-title">${apod.title || ''}</h3>
        </div>
      </div>
      <div class="disc-body">
        <p class="disc-expl">${expl}</p>
      </div>`;
  } else {
    // Fallback to zone fact
    const fact = zone.facts[Math.floor(Math.random() * zone.facts.length)];
    card.innerHTML = `
      <div class="disc-fallback">
        <span class="df-icon">📡</span>
        <h3>NASA signal unavailable today</h3>
        <p>Here's a fact about your current region — <strong>${zone.name}</strong>:</p>
        <blockquote>${fact}</blockquote>
      </div>`;
  }
}

// ─── MISSION CARD ────────────────────────────────────────────────────────────

async function renderMission(zone, distanceAU) {
  const el = document.getElementById('mission-content');
  if (!el) return;

  const nearby = getNearbyMilestone(distanceAU);
  const ms     = nearby || null;
  const query  = ms ? ms.mission.imageQuery : zone.nasaQuery;

  el.innerHTML = `<div class="card-loading"><div class="spin-ring small"></div><span>Searching NASA archive…</span></div>`;

  const img = await fetchNASAImage(query);

  if (img) {
    const msMeta = ms
      ? `<div class="ms-flyby">
           <span class="flyby-tag">FLYBY EVENT</span>
           <strong>${ms.mission.name}</strong> · ${ms.mission.agency}<br>
           <span class="flyby-date">${ms.mission.date} · ${ms.mission.type}</span>
         </div>
         <p class="ms-desc">${ms.mission.desc}</p>`
      : `<p class="ms-desc">${img.desc || zone.description}</p>`;

    el.innerHTML = `
      <div class="ms-img-wrap">
        <img src="${img.href}" alt="${img.title}" class="ms-image" loading="lazy"
             onerror="this.closest('.ms-img-wrap').remove()">
      </div>
      <div class="ms-info">
        <p class="ms-img-title">${img.title}</p>
        ${msMeta}
      </div>`;
  } else {
    // Text fallback
    const target = ms || getNextMilestone(distanceAU);
    el.innerHTML = target
      ? `<div class="ms-text-fallback">
           <div class="ms-emoji-large">${target.emoji}</div>
           <strong>${target.mission.name}</strong> — ${target.mission.agency}<br>
           <em>${target.mission.date}</em>
           <p>${target.mission.desc}</p>
         </div>`
      : `<div class="ms-text-fallback"><p>${zone.facts[0]}</p></div>`;
  }
}

// ─── HERO ─────────────────────────────────────────────────────────────────────

function renderHero(state, zone, streak) {
  const hero = document.getElementById('hero');
  if (hero) hero.style.setProperty('--zone-clr', zone.color);

  setText('hero-day',    state.totalDays);
  setText('hero-au',     state.distanceAU.toFixed(4));
  setText('hero-km',     (state.distanceAU * AU_TO_KM).toLocaleString(undefined, { maximumFractionDigits: 0 }) + ' km from Earth');
  setText('hero-zone-icon',  zone.icon);
  setText('hero-zone-name',  zone.name);
  setText('hero-streak-num', streak);

  const badge = document.getElementById('hero-zone-badge');
  if (badge) badge.style.setProperty('--zone-clr', zone.color);

  const streakEl = document.getElementById('hero-streak');
  if (streakEl) streakEl.style.opacity = streak >= 2 ? '1' : '0.45';
}

function renderStats(state, streak) {
  const distKM = state.distanceAU * AU_TO_KM;
  setText('stat-days',   state.totalDays.toLocaleString());
  setText('stat-streak', streak);
  setText('stat-km',     formatKM(distKM));

  const next = getNextMilestone(state.distanceAU);
  if (next) {
    const days = Math.ceil((next.distanceAU - state.distanceAU) / DAILY_DISTANCE_AU);
    setText('stat-next-days', days.toLocaleString());
    setText('stat-next-lbl',  `Days to ${next.name}`);
  } else {
    setText('stat-next-days', '∞');
    setText('stat-next-lbl',  'Interstellar');
  }
}

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

// ─── LAUNCH ANIMATION ────────────────────────────────────────────────────────

function showLaunchScreen() {
  const screen = document.getElementById('launch-screen');
  if (!screen) return Promise.resolve();
  screen.hidden = false;

  return new Promise(resolve => {
    let n = 3;
    const numEl = document.getElementById('countdown-num');
    const barEl = document.getElementById('launch-bar');

    const tick = setInterval(() => {
      n--;
      if (numEl) numEl.textContent = n > 0 ? n : '🚀';
      if (barEl) barEl.style.width = ((3 - n) / 3 * 100) + '%';

      if (n <= 0) {
        clearInterval(tick);
        setTimeout(() => {
          screen.style.transition = 'opacity 0.7s ease, transform 0.7s ease';
          screen.style.opacity    = '0';
          screen.style.transform  = 'scale(1.04)';
          setTimeout(() => {
            screen.hidden = true;
            screen.style.transition = '';
            screen.style.opacity    = '';
            screen.style.transform  = '';
            resolve();
          }, 720);
        }, 900);
      }
    }, 820);
  });
}

// ─── NEW DAY OVERLAY ─────────────────────────────────────────────────────────

function showNewDayOverlay(state) {
  const screen = document.getElementById('new-day-screen');
  if (!screen) return;
  screen.hidden = false;

  const addedKM = formatKM(DAILY_DISTANCE_AU * AU_TO_KM);
  setText('nd-title',    'DAY ' + state.totalDays);
  setText('nd-added',    '+' + addedKM + ' today');
  setText('nd-total',    state.distanceAU.toFixed(4) + ' AU from Earth');

  const zone = getZone(state.distanceAU);
  const prev = getZone((state.totalDays - 1) * DAILY_DISTANCE_AU);
  setText('nd-zone', zone.id !== prev.id
    ? 'Entering: ' + zone.name
    : zone.name);
}

window.dismissNewDay = function () {
  const screen = document.getElementById('new-day-screen');
  if (!screen) return;
  screen.style.transition = 'opacity 0.4s ease';
  screen.style.opacity    = '0';
  setTimeout(() => {
    screen.hidden      = true;
    screen.style.transition = '';
    screen.style.opacity    = '';
  }, 420);
};

// ─── SHARE ───────────────────────────────────────────────────────────────────

window.shareJourney = async function () {
  const state = loadState();
  if (!state) return;
  const text = `I'm ${state.distanceAU.toFixed(3)} AU from Earth on my Daily Space Journey! 🛸 Day ${state.totalDays} — start yours at journey.svenamberg.com`;
  if (navigator.share) {
    try { await navigator.share({ title: 'Daily Space Journey', text, url: 'https://journey.svenamberg.com' }); } catch (_) {}
  } else {
    try { await navigator.clipboard.writeText(text); } catch (_) {}
    alert('Copied!\n\n' + text);
  }
};

// ─── RESET ───────────────────────────────────────────────────────────────────

window.confirmReset = function () {
  if (!confirm('Reset your entire journey? All progress will be lost and cannot be recovered.')) return;
  try { localStorage.removeItem(STORAGE_KEY); } catch (_) {}
  location.reload();
};

// ─── INIT ────────────────────────────────────────────────────────────────────

async function init() {
  initStars();

  const raw  = loadState();
  const { state, isFirstVisit, isNewDay } = processState(raw);
  const zone   = getZone(state.distanceAU);
  const streak = calcStreak(state.visitLog);

  if (isFirstVisit) {
    await showLaunchScreen();
  } else if (isNewDay) {
    showNewDayOverlay(state);
  }

  // Show app
  const app = document.getElementById('app');
  if (app) app.hidden = false;

  // Synchronous renders
  renderHero(state, zone, streak);
  renderProgressBar(state.distanceAU);
  renderStats(state, streak);
  renderZone(zone, state.distanceAU);
  renderJourneyLog(state);
  renderNextMilestone(state.distanceAU);

  // Async (API) renders — run in parallel
  await Promise.all([
    renderDiscovery(zone),
    renderMission(zone, state.distanceAU)
  ]);
}

document.addEventListener('DOMContentLoaded', init);
