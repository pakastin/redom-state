/* global location */

import { listen, dispatch } from '../utils/dispatch';

export const api = (app, actions) => {
  const onHash = () => {
    const hash = location.hash.slice(1).split('/');

    dispatch(app, 'route', hash);
  };

  listen(app, actions);

  window.addEventListener('hashchange', onHash);

  app.startRoute = onHash;
};
