let id = Date.now();

export default (app) => {
  return {
    route: (state, path) => {
      const [ section ] = path;

      return {
        ...state,
        section
      };
    },
    section: (state, section) => {
      const hash = window.location.hash.slice(1).split('/');

      hash[0] = section;

      window.location.hash = hash.join('/');
    },
    'toggle-debug': (state) => {
      const debug = !app.data.debug;

      return {
        ...state,
        debug
      };
    },
    'toggle-logo': (state) => {
      const logo = !app.data.logo;

      return {
        ...state,
        logo
      };
    },
    'add-text': (state, { type, text }) => {
      return {
        ...state,
        editable: state.editable.concat(
          {
            id: id++,
            type,
            text
          }
        )
      };
    },
    'remove-text': (state, id) => {
      return {
        ...state,
        editable: state.editable.filter(item => {
          return item.id !== id;
        })
      };
    }
  };
};
