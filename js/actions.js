let id = Date.now();

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
    },
    'add-text': ({ type, text }) => {
      app.data = {
        ...app.data,
        editable: app.data.editable.concat(
          {
            id: id++,
            type,
            text
          }
        )
      };
      app.update();
    },
    'remove-text': (id) => {
      app.data = {
        ...app.data,
        editable: app.data.editable.filter(item => {
          return item.id !== id;
        })
      };
      app.update();
    }
  };
};
