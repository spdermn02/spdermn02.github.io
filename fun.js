// Demo deck (a tiny taste of what the plugins do) + the Konami easter egg.
// No DOM parsing of API/user strings here; every node is built with createElement/textContent.

import { cycle, gaugeStep, drift, KONAMI, konamiMatcher } from './lib.js';

const STATUSES = ['Online', 'Idle', 'Do Not Disturb'];
const STATUS_ICON = { Online: '🟢', Idle: '🌙', 'Do Not Disturb': '⛔' };
const SCENES = ['Scene 1', 'Scene 2', 'Scene 3'];
const HOLD_TICK_MS = 150;
const CPU_TICK_MS = 2000;

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
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
  btn.setAttribute('aria-pressed', 'false');
  btn.addEventListener('click', () => {
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
  btn.addEventListener('pointerdown', start);
  btn.addEventListener('pointerup', stop);
  btn.addEventListener('pointercancel', stop);
  btn.addEventListener('pointerleave', stop);
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

function setupCpu(reducedMotion, deck) {
  const { btn, valueSpan } = demoButton({
    id: 'cpu', icon: '🌡️', label: 'CPU', value: '45°C', caption: 'Hardware Monitor',
  });
  let temp = 45;
  btn.addEventListener('click', () => {
    btn.classList.add('flash');
    setTimeout(() => btn.classList.remove('flash'), 150);
  });
  if (!reducedMotion) {
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
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  deck.append(
    setupMic(),
    setupStatus(),
    setupScene(),
    setupGauge(),
    setupHold(),
    setupCpu(reducedMotion, deck),
  );
}

function showToast() {
  const toast = el('div', 'toast', 'Page 2 unlocked 🕷️');
  toast.setAttribute('role', 'status');
  document.body.append(toast);
  setTimeout(() => toast.remove(), 3000);
}

function flipPage() {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reducedMotion) {
    showToast();
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
  showToast();
}

function setupKonami() {
  const push = konamiMatcher(KONAMI);
  document.addEventListener('keydown', (e) => {
    const tag = e.target?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    if (push(e.key)) flipPage();
  });
}

renderDemoDeck();
setupKonami();
