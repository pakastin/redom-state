import { el } from 'redom';

export class Home {
  constructor () {
    this.el = el('.home',
      el('h1', 'Home'),
      el('p', 'Welcome to RE:DOM state handling example.'),
      el('a', { href: '#about' }, 'Check out about section for some more info.')
    );
  }
}
