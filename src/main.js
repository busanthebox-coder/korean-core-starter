import './styles/tokens.css';
import { loadBoot, prefetchAll } from './lib/dataLoader.js';

const target = document.getElementById('app');

function renderBootError(error) {
  target.innerHTML = `
    <section class="boot-error" role="alert">
      <div class="boot-mark">한</div>
      <h1>Study data could not load.</h1>
      <p>Check the connection and try again. The app needs its lesson data before it can start.</p>
      <button type="button" class="boot-retry">Try again</button>
      <small>${error?.message || 'Unknown data loading error'}</small>
    </section>
  `;
  target.querySelector('.boot-retry')?.addEventListener('click', () => window.location.reload());
}

async function start() {
  try {
    await loadBoot();
    const { default: App } = await import('./App.svelte');
    const app = new App({ target });
    target.classList.add('ready');
    prefetchAll();
    return app;
  } catch (error) {
    target.classList.add('ready');
    renderBootError(error);
    return null;
  }
}

export default start();
