import { el, list } from 'redom';
import { MenuItem } from './menu-item';

export class Menu {
  constructor () {
    this.el = el('.menu',
      this.sections = list('.menu-items', MenuItem, 'id')
    );
  }
  update (data) {
    const { sections, section } = data;

    this.sections.update(sections.map(item => {
      return {
        ...item,
        _current: section === item.id
      };
    }));

    this.data = data;
  }
}
