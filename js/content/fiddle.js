import { el, list } from 'redom';
import { dispatch } from '../utils/dispatch';

export class Fiddle {
  constructor () {
    this.el = el('.fiddle',
      el('h1', 'Try add some content'),
      this.form = el('form',
        this.type = el('select',
          el('option', { value: 'h1' }, 'h1'),
          el('option', { value: 'h2' }, 'h2'),
          el('option', { value: 'p' }, 'p')
        ),
        this.text = el('input', { autofocus: true, placeholder: 'text' }),
        el('button', { type: 'submit' }, 'Add text'),
        el('br'),
        el('br'),
        this.editable = list('.editable', Text, 'id')
      )
    );

    this.form.onsubmit = e => {
      e.preventDefault();

      dispatch(this, 'add-text', {
        type: this.type.value,
        text: this.text.value
      });
      this.text.value = '';
      this.text.focus();
    };
  }
  update (data) {
    const { editable } = data;

    this.editable.update(editable);
    this.data = data;
  }
}

class Text {
  constructor (initData, data) {
    this.el = el(data.type,
      this.span = el('span'),
      this.remove = el('button', 'x')
    );
    this.remove.onclick = e => {
      dispatch(this, 'remove-text', this.data.id);
    };
  }
  update (data) {
    this.span.textContent = data.text;
    this.data = data;
  }
}
