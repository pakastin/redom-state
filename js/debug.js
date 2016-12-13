import { el, mount } from 'redom';

export class Debug {
  constructor (app) {
    this.el = el('.debug');
    this.app = app;

    this.onDebug = e => {
      const { data, type } = e.detail;

      if (data) {
        this.log(`{ "type": "${type}", data: "${data}" }`);
      } else {
        this.log(`{ "type": '${type}" }`);
      }
    };

    this.data = {};
  }
  update (data) {
    const { debug } = data;

    if (debug) {
      this.el.style.display = '';
      this.app.el.addEventListener('redom', this.onDebug);
    } else {
      this.el.style.display = 'none';
      this.app.el.removeEventListener('redom', this.onDebug);
    }

    if (debug !== !!this.data.debug) {
      if (debug) {
        this.log(`{ "type": "toggle-debug" }`);
      } else {
        this.log(`{ "type": "toggle-debug" }`);
      }
    }

    this.data = data;
  }
  log (msg) {
    mount(this.el, el('p', Date.now() + ' <- ' + msg));
    mount(this.el, el('p', Date.now() + ' -> ' + JSON.stringify(this.app.data, null, ' ')));
    mount(this.el, el('br'));

    this.el.scrollTop = this.el.scrollHeight;
  }
}
