// October spooky mode. Loaded first so the class is set before the other modules run.
// Preview any time with ?spooky.

import { isSpooky } from './lib.js';

if (isSpooky(new Date(), location.search)) {
  document.documentElement.classList.add('spooky');
}
