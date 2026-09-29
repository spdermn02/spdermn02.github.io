// October spooky mode. Loaded before app.js/fun.js so the class is on <html> before first paint.
// Preview any time with ?spooky.

import { isSpooky } from './lib.js';

if (isSpooky(new Date(), location.search)) {
  document.documentElement.classList.add('spooky');
}
