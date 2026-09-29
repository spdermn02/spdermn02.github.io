// 404 page: "map this button" easter egg. No DOM parsing, only textContent.

const NAV_DELAY_MS = 600;

const btn = document.getElementById('map-btn');

function mapIt() {
  if (btn.classList.contains('mapped')) return;
  btn.classList.add('mapped');
  btn.setAttribute('role', 'status');
  btn.setAttribute('aria-live', 'polite');
  const label = btn.querySelector('.demo-label');
  if (label) label.textContent = 'Mapped ✓';
  const value = btn.querySelector('.demo-value');
  if (value) value.textContent = '';
  setTimeout(() => location.assign('/'), NAV_DELAY_MS);
}

if (btn) btn.addEventListener('click', mapIt);
