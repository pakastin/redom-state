import { el, router } from 'redom';

import { Home } from './home';
import { Info } from './info';
import { Fiddle } from './fiddle';

export class Content {
  constructor () {
    this.el = el('.content');

    this.router = router(this.el, {
      '': Home,
      info: Info,
      fiddle: Fiddle
    });
  }
  update (data) {
    const { section } = data;

    this.router.update(section, data);
  }
}
