import './styles.css';
import { App } from './ui/App';

const root = document.getElementById('ui');
const canvas = document.getElementById('scene');

if (!root || !(canvas instanceof HTMLCanvasElement)) {
  throw new Error('Missing #ui or #scene element.');
}

/** The game draws its scenes with WebGL. Some browsers have it switched off (hardware acceleration off, an old
 * graphics driver, a locked-down work computer). Say so plainly instead of leaving a blank screen. */
function noWebGl(ui: HTMLElement): void {
  ui.className = 'is-title';
  ui.innerHTML = `<section class="screen center">
    <div class="brand"><h1>IMMIGRANT</h1><p class="sub">A journey, one year at a time</p></div>
    <div class="panel no-gl">
      <h2>This browser cannot show the game's 3D scenes</h2>
      <p>The game needs WebGL, which is switched off or unavailable here. Usually one of these fixes it:</p>
      <ul>
        <li><b>Chrome or Edge:</b> Settings, then System, turn on "Use graphics acceleration when available", then restart the browser.</li>
        <li><b>Firefox:</b> Settings, then Performance, allow hardware acceleration, then restart.</li>
        <li><b>Safari:</b> update to the latest version of macOS or iOS.</li>
        <li>Or try another browser or device. A work computer may block it on purpose.</li>
      </ul>
    </div>
  </section>`;
}

const probe = document.createElement('canvas');
const gl = probe.getContext('webgl2') ?? probe.getContext('webgl');
if (!gl) {
  noWebGl(root);
} else {
  try {
    new App(root, canvas);
  } catch (e) {
    console.error(e);
    noWebGl(root);
  }
}
