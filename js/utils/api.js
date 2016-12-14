/* global location */

import { listen, dispatch } from '../utils/dispatch';

export const api = (app, actions) => {
  const onHash = () => {
    const hash = location.hash.slice(1).split('/');

    dispatch(app, 'route', hash);
  };

  const wrappedActions = {};

  for (let key in actions) {
    wrappedActions[key] = (data, e) => {
      const newState = actions[key](app.data, data, e);
      if (newState) {
        app.data = newState;
        app.update();
      }
    };
  }

  listen(app, wrappedActions);

  window.addEventListener('hashchange', onHash);

  app.startRoute = onHash;
};
