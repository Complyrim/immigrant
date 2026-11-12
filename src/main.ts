import './styles.css';
import { App } from './ui/App';

const root = document.getElementById('ui');
const canvas = document.getElementById('scene');

if (!root || !(canvas instanceof HTMLCanvasElement)) {
  throw new Error('Missing #ui or #scene element.');
}

new App(root, canvas);
