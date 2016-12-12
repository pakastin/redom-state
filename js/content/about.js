import { el } from 'redom';
import { dispatch } from '../utils/dispatch';

export class About {
  constructor () {
    this.el = el('.about',
      el('h1', 'About RE:DOM state handling'),
      el('p', 'I like to do RE:DOM state handling so that I dispatch custom HTML event upstream and update RE:DOM components downstream.'),
      el('p', 'Turn on the debug mode, navigate around and see what happens under the hood:'),
      this.toggleDebug = el('button'),
      el('br'),
      this.toggleLogo = el('button'),
      el('br'),
      el('br'),
      this.logo = el('img'),
      el('br'),
      el('br'),
      el('p',
        el('i', 'ps. try refresh the page and see what happens ;)')
      )
    );
    this.toggleDebug.onclick = e => {
      dispatch(this, 'toggle-debug');
    };
    this.toggleLogo.onclick = e => {
      dispatch(this, 'toggle-logo');
    };
  }
  update (data) {
    const { debug, logo } = data;

    if (debug) {
      this.toggleDebug.textContent = 'Deactivate state debugging';
    } else {
      this.toggleDebug.textContent = 'Activate state debugging';
    }

    if (logo) {
      this.toggleLogo.textContent = 'Hide logo';
      this.logo.src = 'https://redom.js.org/img/logo.svg';
    } else {
      this.toggleLogo.textContent = 'Show logo';
      this.logo.src = '';
    }

    this.data = data;
  }
}
