import { el, router } from 'redom';

import { Home } from './home';
import { About } from './about';

export class Content {
  constructor () {
    this.el = el('.content');

    this.router = router(this.el, {
      '': Home,
      about: About
    });
  }
  update (data) {
    const { section } = data;

    this.router.update(section, data);
  }
}
