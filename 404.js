// 404 page: "map this button" easter egg. No DOM parsing, only textContent.

const NAV_DELAY_MS = 600;

const btn = document.getElementById('map-btn');
const status = document.getElementById('map-status');

function mapIt() {
  if (btn.classList.contains('mapped')) return;
  btn.classList.add('mapped');
  const label = btn.querySelector('.demo-label');
  if (label) label.textContent = 'Mapped ✓';
  const value = btn.querySelector('.demo-value');
  if (value) value.textContent = '';
  if (status) status.textContent = 'Mapped ✓ — heading home';
  setTimeout(() => location.assign('/'), NAV_DELAY_MS);
}

if (btn) btn.addEventListener('click', mapIt);
