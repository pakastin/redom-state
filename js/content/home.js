import { el, list } from 'redom';

export class Home {
  constructor () {
    this.el = el('.home',
      el('h1', 'Home'),
      el('p', 'Welcome to RE:DOM state handling example.'),
      el('p',
        el('a', { href: '#info' }, 'Check out about section for some more info.')
      ),
      el('p',
        el('a', { target: '_blank', href: 'https://github.com/pakastin/redom-state' }, 'See source on Github!')
      )
    );
  }
}
