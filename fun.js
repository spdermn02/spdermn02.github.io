// Demo deck (a tiny taste of what the plugins do) + a few easter eggs.
// No DOM parsing of API/user strings here; every node is built with createElement/textContent
// (or createElementNS for the decorative spiders).

import { cycle, gaugeStep, drift, KONAMI, konamiMatcher, rapidClicks } from './lib.js';

const STATUSES = ['Online', 'Idle', 'Do Not Disturb'];
const STATUS_ICON = { Online: '🟢', Idle: '🌙', 'Do Not Disturb': '⛔' };
const SCENES = ['Scene 1', 'Scene 2', 'Scene 3'];
const HOLD_TICK_MS = 150;
const CPU_TICK_MS = 2000;
const MIC_HOLD_MS = 3000;
const SVG_NS = 'http://www.w3.org/2000/svg';

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

function svgEl(tag, attrs) {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
  return node;
}

// Small inline spider used for the scuttle easter egg (round body + 8 legs).
function buildSpiderSvg() {
  const svg = svgEl('svg', { viewBox: '0 0 24 24' });
  const g = svgEl('g', { fill: 'none', stroke: 'currentColor', 'stroke-width': '1.4', 'stroke-linecap': 'round' });
  const legs = [
    'M4 8 L9 11', 'M4 11 L9 12', 'M4 14 L9 13', 'M4 17 L9 15',
    'M20 8 L15 11', 'M20 11 L15 12', 'M20 14 L15 13', 'M20 17 L15 15',
  ];
  for (const d of legs) g.append(svgEl('path', { d }));
  svg.append(g);
  svg.append(svgEl('circle', { cx: '12', cy: '13', r: '3', fill: 'currentColor' }));
  svg.append(svgEl('circle', { cx: '12', cy: '9', r: '2', fill: 'currentColor' }));
  return svg;
}

function demoButton({ id, icon, label, value, caption }) {
  const btn = el('button', 'demo-btn');
  btn.type = 'button';
  btn.id = `demo-${id}`;
  const iconSpan = el('span', 'demo-icon', icon);
  iconSpan.setAttribute('aria-hidden', 'true');
  const labelSpan = el('span', 'demo-label', label);
  const valueSpan = el('span', 'demo-value', value);
  valueSpan.setAttribute('aria-live', 'polite');
  const captionSpan = el('span', 'demo-btn-caption', caption);
  btn.append(iconSpan, labelSpan, valueSpan, captionSpan);
  return { btn, iconSpan, valueSpan };
}

function setupMic() {
  const { btn, valueSpan } = demoButton({
    id: 'mic', icon: '🎙️', label: 'Mic', value: 'Live', caption: 'Discord plugin',
  });
  let muted = false;
  let holdTimer = null;
  let dropTriggered = false;
  btn.setAttribute('aria-pressed', 'false');

  const startHold = () => {
    if (holdTimer) return;
    holdTimer = setTimeout(() => {
      holdTimer = null;
      dropTriggered = true;
      if (!prefersReducedMotion) btn.classList.add('mic-drop');
      showToast('🎤 mic drop');
    }, MIC_HOLD_MS);
  };
  const cancelHold = () => {
    if (holdTimer) {
      clearTimeout(holdTimer);
      holdTimer = null;
    }
  };

  btn.addEventListener('pointerdown', (e) => {
    btn.setPointerCapture?.(e.pointerId);
    startHold();
  });
  btn.addEventListener('pointerup', cancelHold);
  btn.addEventListener('pointercancel', cancelHold);
  btn.addEventListener('pointerleave', cancelHold);
  btn.addEventListener('keydown', (e) => {
    if (e.key === ' ' || e.key === 'Spacebar') e.preventDefault();
    if (e.repeat) return;
    if (e.key === ' ' || e.key === 'Spacebar' || e.key === 'Enter') startHold();
  });
  btn.addEventListener('keyup', (e) => {
    if (e.key === ' ' || e.key === 'Spacebar' || e.key === 'Enter') cancelHold();
  });
  btn.addEventListener('blur', cancelHold);
  btn.addEventListener('animationend', (e) => {
    if (e.animationName === 'mic-drop') btn.classList.remove('mic-drop');
  });
  btn.addEventListener('click', () => {
    if (dropTriggered) {
      dropTriggered = false;
      return;
    }
    muted = !muted;
    btn.setAttribute('aria-pressed', String(muted));
    btn.classList.toggle('is-muted', muted);
    valueSpan.textContent = muted ? 'Muted' : 'Live';
  });
  return btn;
}

function setupStatus() {
  const { btn, iconSpan, valueSpan } = demoButton({
    id: 'status', icon: STATUS_ICON.Online, label: 'Status', value: 'Online', caption: 'Discord plugin',
  });
  let status = 'Online';
  btn.addEventListener('click', () => {
    status = cycle(STATUSES, status);
    valueSpan.textContent = status;
    iconSpan.textContent = STATUS_ICON[status];
  });
  return btn;
}

function setupScene() {
  const { btn, valueSpan } = demoButton({
    id: 'scene', icon: '🎬', label: 'Scene', value: SCENES[0], caption: 'Page & scene switching',
  });
  let scene = SCENES[0];
  btn.addEventListener('click', () => {
    scene = cycle(SCENES, scene);
    valueSpan.textContent = scene;
  });
  return btn;
}

function setupGauge() {
  const { btn, valueSpan } = demoButton({
    id: 'gauge', icon: '📊', label: 'Gauge', value: '0%', caption: 'Dynamic Icons',
  });
  const fill = el('span', 'demo-fill');
  fill.setAttribute('aria-hidden', 'true');
  btn.append(fill);
  let pct = 0;
  fill.style.setProperty('--fill', `${pct}%`);
  btn.addEventListener('click', () => {
    pct = gaugeStep(pct);
    valueSpan.textContent = `${pct}%`;
    fill.style.setProperty('--fill', `${pct}%`);
  });
  return btn;
}

function setupHold() {
  const { btn, valueSpan } = demoButton({
    id: 'hold', icon: '⏱️', label: 'Hold', value: '0', caption: 'AdvancedHold plugin',
  });
  let count = 0;
  let timer = null;
  const start = () => {
    if (timer) return;
    timer = setInterval(() => {
      count += 1;
      valueSpan.textContent = String(count);
    }, HOLD_TICK_MS);
  };
  const stop = () => {
    if (timer) clearInterval(timer);
    timer = null;
    count = 0;
    valueSpan.textContent = '0';
  };
  btn.addEventListener('pointerdown', (e) => {
    btn.setPointerCapture?.(e.pointerId);
    start();
  });
  btn.addEventListener('pointerup', stop);
  btn.addEventListener('pointercancel', stop);
  btn.addEventListener('pointerleave', stop);
  btn.addEventListener('contextmenu', (e) => e.preventDefault());
  btn.addEventListener('keydown', (e) => {
    if (e.key === ' ' || e.key === 'Spacebar') e.preventDefault();
    if (e.repeat) return;
    if (e.key === ' ' || e.key === 'Spacebar' || e.key === 'Enter') start();
  });
  btn.addEventListener('keyup', (e) => {
    if (e.key === ' ' || e.key === 'Spacebar' || e.key === 'Enter') stop();
  });
  btn.addEventListener('blur', stop);
  return btn;
}

function setupCpu(deck) {
  const { btn, valueSpan } = demoButton({
    id: 'cpu', icon: '🌡️', label: 'CPU', value: '45°C', caption: 'Hardware Monitor',
  });
  let temp = 45;
  btn.addEventListener('click', () => {
    btn.classList.add('flash');
    setTimeout(() => btn.classList.remove('flash'), 150);
  });
  if (!prefersReducedMotion) {
    let timer = null;
    const tick = () => {
      const delta = Math.round(Math.random() * 8 - 4);
      temp = drift(temp, delta);
      valueSpan.textContent = `${temp}°C`;
    };
    const io = new IntersectionObserver((entries) => {
      const visible = entries.some((entry) => entry.isIntersecting);
      if (visible && !timer) timer = setInterval(tick, CPU_TICK_MS);
      if (!visible && timer) {
        clearInterval(timer);
        timer = null;
      }
    });
    io.observe(deck);
  }
  return btn;
}

function renderDemoDeck() {
  const deck = document.getElementById('demo-deck');
  if (!deck) return;
  deck.append(
    setupMic(),
    setupStatus(),
    setupScene(),
    setupGauge(),
    setupHold(),
    setupCpu(deck),
  );
}

let activeToast = null;
let toastTimer = null;

function showToast(text) {
  if (activeToast) {
    clearTimeout(toastTimer);
    activeToast.remove();
  }
  const toast = el('div', 'toast', text);
  toast.setAttribute('role', 'status');
  document.body.append(toast);
  activeToast = toast;
  toastTimer = setTimeout(() => {
    toast.remove();
    activeToast = null;
    toastTimer = null;
  }, 3000);
}

function flipPage() {
  const spooky = document.documentElement.classList.contains('spooky');
  const message = spooky ? 'Page 2 unlocked 🎃' : 'Page 2 unlocked 🕷️';
  if (prefersReducedMotion) {
    showToast(message);
    return;
  }
  const grid = document.getElementById('repo-grid');
  const deck = document.getElementById('demo-deck');
  grid?.classList.add('page-flip');
  deck?.classList.add('page-flip');
  setTimeout(() => {
    grid?.classList.remove('page-flip');
    deck?.classList.remove('page-flip');
  }, 700);
  showToast(message);
}

function setupKonami() {
  const push = konamiMatcher(KONAMI);
  document.addEventListener('keydown', (e) => {
    const tag = e.target?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    if (push(e.key)) flipPage();
  });
}

// Avatar spider: 5 fast clicks on the avatar sends a little spider scuttling across the bottom.
const SCUTTLE_SAFETY_MS = 4000;

function scuttleSpider() {
  if (document.querySelector('.scuttle')) return;
  if (prefersReducedMotion) {
    showToast('🕷️ eek');
    return;
  }
  const scuttle = el('div', 'scuttle');
  scuttle.setAttribute('aria-hidden', 'true');
  scuttle.append(buildSpiderSvg());
  document.body.append(scuttle);
  let removed = false;
  const remove = () => {
    if (removed) return;
    removed = true;
    scuttle.remove();
  };
  scuttle.addEventListener('animationend', (e) => {
    if (e.animationName === 'scuttle-across') remove();
  });
  setTimeout(remove, SCUTTLE_SAFETY_MS);
}

function setupAvatarSpider() {
  const target = document.querySelector('.avatar-wrap') ?? document.querySelector('.avatar');
  if (!target) return;
  const click = rapidClicks(5, 2000);
  target.addEventListener('click', () => {
    if (click(Date.now())) scuttleSpider();
  });
}

// Console hello: a little ASCII spider, once per page load.
const SPIDER_ART = [
  '   /\\_/\\',
  '  ( o.o )',
  ' > ^  ^ <',
].join('\n');

function logConsoleHello() {
  console.log(
    `%c${SPIDER_ART}\n\nBuild your own Touch Portal plugin → npm i touchportal-api\nhttps://github.com/spdermn02/touchportal-node-api`,
    'font-family: monospace; font-size: 12px; color: #f5a524; line-height: 1.3;',
  );
}

renderDemoDeck();
setupKonami();
setupAvatarSpider();
logConsoleHello();
