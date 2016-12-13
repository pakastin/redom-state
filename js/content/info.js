import { el } from 'redom';
import { dispatch } from '../utils/dispatch';

export class Info {
  constructor () {
    this.el = el('.info',
      el('h1', 'RE:DOM state handling'),
      el('p',
        'I like to do RE:DOM state handling so that I dispatch custom HTML event upstream and update RE:DOM components downstream.',
        el('br'),
        'To learn more how it works, check out Github repo: ',
        el('a', { href: 'https://github.com/pakastin/redom-state' }, 'https://github.com/pakastin/redom-state')
      ),
      el('p', 'Turn on the debug mode, navigate around and see what happens under the hood:'),
      this.toggleDebug = el('button'),
      el('br'),
      this.toggleLogo = el('button'),
      el('br'),
      el('br'),
      this.logo = el('img', { src: 'https://redom.js.org/img/logo.svg' }),
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
      this.logo.style.display = '';
    } else {
      this.toggleLogo.textContent = 'Show logo';
      this.logo.style.display = 'none';
    }

    this.data = data;
  }
}
