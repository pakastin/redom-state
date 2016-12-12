/* global CustomEvent */

export const dispatch = (view, type, data) => {
  const el = view.el || view;

  el.dispatchEvent(new CustomEvent('redom', {
    detail: {
      type, data
    },
    bubbles: true
  }));
};

export const listen = (view, handlers) => {
  const el = view.el || view;

  el.addEventListener('redom', e => {
    const { type, data } = e.detail;
    const handler = handlers[type];

    handler && handler(data, e);
  });
};
