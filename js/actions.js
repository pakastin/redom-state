export default (app) => {
  return {
    route: (path) => {
      const [ section ] = path;

      app.data = {
        ...app.data,
        section: section
      };

      app.update();
    },
    section: section => {
      const hash = window.location.hash.slice(1).split('/');

      hash[0] = section;

      window.location.hash = hash.join('/');
    },
    'toggle-debug': () => {
      const debug = !app.data.debug;

      app.data = {
        ...app.data,
        debug
      };
      app.update();
    },
    'toggle-logo': () => {
      const logo = !app.data.logo;

      app.data = {
        ...app.data,
        logo
      };

      app.update();
    }
  };
};
