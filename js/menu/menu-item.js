import { el } from 'redom';
import { dispatch } from '../utils/dispatch';

export class MenuItem {
  constructor () {
    this.el = el('.menu-item');

    this.el.onclick = e => {
      dispatch(this, 'section', this.data.id);
    };
  }
  update (data) {
    const { name, _current } = data;

    this.el.textContent = name;

    if (_current) {
      this.el.classList.add('current');
    } else {
      this.el.classList.remove('current');
    }

    this.data = data;
  }
}
