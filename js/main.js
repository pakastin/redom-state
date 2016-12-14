(function () {
'use strict';

var HASH = '#';
var DOT = '.';

function createElement (query, ns) {
  var tag;
  var id;
  var className;

  var mode = 0;
  var start = 0;
  var len = query.length;

  for (var i = 0; i <= len; i++) {
    var char = query[i];

    if (char === HASH || char === DOT || char == null) {
      if (mode === 0) {
        if (i === 0) {
          tag = 'div';
        } else if (char == null) {
          tag = query;
        } else {
          tag = query.substring(start, i);
        }
      } else {
        var slice = query.substring(start, i);

        if (mode === 1) {
          id = slice;
        } else if (className) {
          className += ' ' + slice;
        } else {
          className = slice;
        }
      }

      start = i + 1;

      if (char === HASH) {
        mode = 1;
      } else {
        mode = 2;
      }
    }
  }

  var element = ns ? document.createElementNS(ns, tag) : document.createElement(tag);

  if (id) {
    element.id = id;
  }

  if (className) {
    element.className = className;
  }

  return element;
}

function text (content) {
  return document.createTextNode(content);
}

function mount (parent, child, before) {
  var parentEl = parent.el || parent;
  var childEl = child.el || child;

  if (childEl.__redom_list) {
    childEl = childEl.el;
  }

  if (child === childEl && childEl.__redom_view) {
    // try to look up the view if not provided
    child = childEl.__redom_view;
  }

  if (child !== childEl) {
    childEl.__redom_view = child;
  }
  if (child.isMounted) {
    child.remount && child.remount();
  } else {
    child.mount && child.mount();
  }
  if (before) {
    parentEl.insertBefore(childEl, before.el || before);
  } else {
    parentEl.appendChild(childEl);
  }
  if (child.isMounted) {
    child.remounted && child.remounted();
  } else {
    child.isMounted = true;
    child.mounted && child.mounted();
  }
}

function unmount (parent, child) {
  var parentEl = parent.el || parent;
  var childEl = child.el || child;

  if (child === childEl && childEl.__redom_view) {
    // try to look up the view if not provided
    child = childEl.__redom_view;
  }

  child.unmount && child.unmount();

  parentEl.removeChild(childEl);

  child.isMounted = false;
  child.unmounted && child.unmounted();
}

var elcache = {};

function el (query) {
  var arguments$1 = arguments;

  var element;

  if (typeof query === 'string') {
    element = (elcache[query] || (elcache[query] = createElement(query))).cloneNode(false);
  } else if (query && query.nodeType) {
    element = query.cloneNode(false);
  } else {
    throw new Error('At least one argument required');
  }

  var empty = true;

  for (var i = 1; i < arguments.length; i++) {
    var arg = arguments$1[i];

    if (!arg) {
      continue;
    }

    // support middleware
    if (typeof arg === 'function') {
      arg(element);
    } else if (typeof arg === 'string' || typeof arg === 'number') {
      if (empty) {
        empty = false;
        element.textContent = arg;
      } else {
        element.appendChild(text(arg));
      }
    } else if (arg.nodeType || (arg.el && arg.el.nodeType)) {
      empty = false;
      mount(element, arg);
    } else if (arg.length) {
      empty = false;
      for (var j = 0; j < arg.length; j++) {
        mount(element, arg[j]);
      }
    } else if (typeof arg === 'object') {
      for (var key in arg) {
        var value = arg[key];

        if (key === 'style') {
          if (typeof value === 'string') {
            element.setAttribute(key, value);
          } else {
            for (var cssKey in value) {
              element.style[cssKey] = value[cssKey];
            }
          }
        } else if (key in element || typeof value === 'function') {
          element[key] = value;
        } else {
          element.setAttribute(key, value);
        }
      }
    }
  }

  return element;
}

el.extend = function (query) {
  var clone = (elcache[query] || (elcache[query] = createElement(query)));

  return el.bind(this, clone);
};

function setChildren (parent, children) {
  var parentEl = parent.el || parent;
  var traverse = parentEl.firstChild;

  for (var i = 0; i < children.length; i++) {
    var child = children[i];

    if (!child) {
      continue;
    }

    var childEl = child.el || child;

    if (childEl === traverse) {
      traverse = traverse.nextSibling;
      continue;
    }

    mount(parent, child, traverse);
  }

  while (traverse) {
    var next = traverse.nextSibling;

    unmount(parent, traverse);

    traverse = next;
  }
}

function list (parent, View, key, initData) {
  return new List(parent, View, key, initData);
}

function List (parent, View, key, initData) {
  this.__redom_list = true;
  this.View = View;
  this.key = key;
  this.initData = initData;
  this.views = [];
  this.el = typeof parent === 'string' ? el(parent) : parent;

  if (key) {
    this.lookup = {};
  }
}

List.extend = function (parent, View, key, initData) {
  return List.bind(List, parent, View, key, initData);
};

list.extend = List.extend;

List.prototype.update = function (data) {
  var View = this.View;
  var key = this.key;
  var functionKey = typeof key === 'function';
  var initData = this.initData;
  var newViews = new Array(data.length);
  var oldViews = this.views;
  var newLookup = key && {};
  var oldLookup = key && this.lookup;

  for (var i = 0; i < data.length; i++) {
    var item = data[i];
    var view = (void 0);

    if (key) {
      var id = functionKey ? key(item) : item[key];
      view = newViews[i] = oldLookup[id] || new View(initData, item, i, data);
      newLookup[id] = view;
      view.__id = id;
    } else {
      view = newViews[i] = oldViews[i] || new View(initData, item, i, data);
    }
    var el$$1 = view.el;
    if (el$$1.__redom_list) {
      el$$1 = el$$1.el;
    }
    el$$1.__redom_view = view;
    view.update && view.update(item, i, data);
  }

  setChildren(this, newViews);

  if (key) {
    this.lookup = newLookup;
  }
  this.views = newViews;
};

function router (parent, Views) {
  return new Router(parent, Views);
}

var Router = function Router (parent, Views) {
  this.el = typeof parent === 'string' ? el(parent) : parent;
  this.Views = Views;
};
Router.prototype.update = function update (route, data) {
  if (route !== this.route) {
    var Views = this.Views;
    var View = Views[route];

    this.view = View && new View();
    this.route = route;

    setChildren(this.el, [ this.view ]);
  }
  this.view && this.view.update && this.view.update(data);
};

var SVG = 'http://www.w3.org/2000/svg';

var svgcache = {};

function svg (query, a) {
  var arguments$1 = arguments;

  var element;

  if (typeof query === 'string') {
    element = (svgcache[query] || (svgcache[query] = createElement(query, SVG))).cloneNode(false);
  } else if (query && query.nodeType) {
    element = query.cloneNode(false);
  } else {
    throw new Error('At least one argument required');
  }

  var empty = true;

  for (var i = 1; i < arguments.length; i++) {
    var arg = arguments$1[i];

    if (!arg) {
      continue;
    } else if (typeof arg === 'function') {
      arg = arg(element);
    } else if (typeof arg === 'string' || typeof arg === 'number') {
      if (empty) {
        empty = false;
        element.textContent = arg;
      } else {
        element.appendChild(text(arg));
      }
    } else if (arg.nodeType || (arg.el && arg.el.nodeType)) {
      empty = false;
      mount(element, arg);
    } else if (typeof arg === 'object') {
      for (var key in arg) {
        var value = arg[key];

        if (key === 'style' && typeof value !== 'string') {
          for (var cssKey in value) {
            element.style[cssKey] = value[cssKey];
          }
        } else if (typeof value === 'function') {
          element[key] = value;
        } else {
          element.setAttribute(key, value);
        }
      }
    }
  }

  return element;
}

svg.extend = function (query) {
  var clone = (svgcache[query] || (svgcache[query] = createElement(query, SVG)));

  return svg.bind(this, clone);
};

/* global CustomEvent */

var dispatch = function (view, type, data) {
  var el = view.el || view;

  el.dispatchEvent(new CustomEvent('redom', {
    detail: {
      type: type, data: data
    },
    bubbles: true
  }));
};

var listen = function (view, handlers) {
  var el = view.el || view;

  el.addEventListener('redom', function (e) {
    var ref = e.detail;
    var type = ref.type;
    var data = ref.data;
    var handler = handlers[type];

    handler && handler(data, e);
  });
};

var MenuItem = function MenuItem () {
  var this$1 = this;

  this.el = el('.menu-item');

  this.el.onclick = function (e) {
    dispatch(this$1, 'section', this$1.data.id);
  };
};
MenuItem.prototype.update = function update (data) {
  var name = data.name;
    var _current = data._current;

  this.el.textContent = name;

  if (_current) {
    this.el.classList.add('current');
  } else {
    this.el.classList.remove('current');
  }

  this.data = data;
};

var Menu = function Menu () {
  this.el = el('.menu',
    this.sections = list('.menu-items', MenuItem, 'id')
  );
};
Menu.prototype.update = function update (data) {
  var sections = data.sections;
    var section = data.section;

  this.sections.update(sections.map(function (item) {
    return Object.assign({}, item,
      {_current: section === item.id});
  }));

  this.data = data;
};

var Home = function Home () {
  this.el = el('.home',
    el('h1', 'Home'),
    el('p', 'Welcome to RE:DOM state handling example.'),
    el('p',
      el('a', { href: '#info' }, 'Check out info section for some more info.')
    ),
    el('p',
      el('a', { target: '_blank', href: 'https://github.com/pakastin/redom-state' }, 'See source on Github!')
    )
  );
};

var Info = function Info () {
  var this$1 = this;

  this.el = el('.info',
    el('h1', 'RE:DOM state handling'),
    el('p',
      'I like to do RE:DOM state handling so that I dispatch custom HTML event upstream and update RE:DOM components downstream.',
      el('br'),
      'To learn more how it works, check out Github repo: ',
      el('a', { target: '_blank', href: 'https://github.com/pakastin/redom-state' }, 'https://github.com/pakastin/redom-state')
    ),
    el('p', 'Turn on the debug mode, navigate around and see what happens under the hood:'),
    this.toggleDebug = el('button'),
    el('br'),
    this.toggleLogo = el('button'),
    el('br'),
    el('br'),
    this.logo = el('img', { src: 'https://redom.js.org/img/logo.svg' }),
    el('br'),
    el('br'),
    el('p',
      el('i', 'ps. try refresh the page and see what happens ;)')
    )
  );
  this.toggleDebug.onclick = function (e) {
    dispatch(this$1, 'toggle-debug');
  };
  this.toggleLogo.onclick = function (e) {
    dispatch(this$1, 'toggle-logo');
  };
};
Info.prototype.update = function update (data) {
  var debug = data.debug;
    var logo = data.logo;

  if (debug) {
    this.toggleDebug.textContent = 'Deactivate state debugging';
  } else {
    this.toggleDebug.textContent = 'Activate state debugging';
  }

  if (logo) {
    this.toggleLogo.textContent = 'Hide logo';
    this.logo.style.display = '';
  } else {
    this.toggleLogo.textContent = 'Show logo';
    this.logo.style.display = 'none';
  }

  this.data = data;
};

var Fiddle = function Fiddle () {
  var this$1 = this;

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

  this.form.onsubmit = function (e) {
    e.preventDefault();

    dispatch(this$1, 'add-text', {
      type: this$1.type.value,
      text: this$1.text.value
    });
    this$1.text.value = '';
    this$1.text.focus();
  };
};
Fiddle.prototype.update = function update (data) {
  var editable = data.editable;

  this.editable.update(editable);
  this.data = data;
};

var Text = function Text (initData, data) {
  var this$1 = this;

  this.el = el(data.type,
    this.span = el('span'),
    this.remove = el('button', 'x')
  );
  this.remove.onclick = function (e) {
    dispatch(this$1, 'remove-text', this$1.data.id);
  };
};
Text.prototype.update = function update (data) {
  this.span.textContent = data.text;
  this.data = data;
};

var Content = function Content () {
  this.el = el('.content');

  this.router = router(this.el, {
    '': Home,
    info: Info,
    fiddle: Fiddle
  });
};
Content.prototype.update = function update (data) {
  var section = data.section;

  this.router.update(section, data);
};

var Debug = function Debug (app) {
  var this$1 = this;

  this.el = el('.debug');
  this.app = app;

  this.onDebug = function (e) {
    var ref = e.detail;
    var data = ref.data;
    var type = ref.type;

    if (data) {
      this$1.log(("{ \"type\": \"" + type + "\", data: \"" + data + "\" }"));
    } else {
      this$1.log(("{ \"type\": '" + type + "\" }"));
    }
  };

  this.data = {};
};
Debug.prototype.update = function update (data) {
  var debug = data.debug;

  if (debug) {
    this.el.style.display = '';
    this.app.el.addEventListener('redom', this.onDebug);
  } else {
    this.el.style.display = 'none';
    this.app.el.removeEventListener('redom', this.onDebug);
  }

  if (debug !== !!this.data.debug) {
    if (debug) {
      this.log("{ \"type\": \"toggle-debug\" }");
    } else {
      this.log("{ \"type\": \"toggle-debug\" }");
    }
  }

  this.data = data;
};
Debug.prototype.log = function log (msg) {
  mount(this.el, el('p', Date.now() + ' <- ' + msg));
  mount(this.el, el('p', Date.now() + ' -> ' + JSON.stringify(this.app.data, null, ' ')));
  mount(this.el, el('br'));

  this.el.scrollTop = this.el.scrollHeight;
};

var App = function App (data) {
  this.el = el('.app',
    this.menu = new Menu(),
    this.content = new Content(),
    this.debug = new Debug(this)
  );

  this.data = data;
};
App.prototype.update = function update () {
  this.menu.update(this.data);
  this.content.update(this.data);
  this.debug.update(this.data);

  window.localStorage && window.localStorage.setItem('redom-state', JSON.stringify(this.data));
};
App.prototype.recoverData = function recoverData () {
  var savedData = window.localStorage && window.localStorage.getItem('redom-state');

  if (savedData) {
    this.data = JSON.parse(savedData);
    this.update();
  }
};

/* global location */

var api = function (app, actions) {
  var onHash = function () {
    var hash = location.hash.slice(1).split('/');

    dispatch(app, 'route', hash);
  };

  var wrappedActions = {};

  var loop = function ( key ) {
    wrappedActions[key] = function (data, e) {
      var newState = actions[key](app.data, data, e);
      if (newState) {
        app.data = newState;
        app.update();
      }
    };
  };

  for (var key in actions) loop( key );

  listen(app, wrappedActions);

  window.addEventListener('hashchange', onHash);

  app.startRoute = onHash;
};

var id = Date.now();

var actions = function (app) {
  return {
    route: function (state, path) {
      var section = path[0];

      return Object.assign({}, state,
        {section: section});
    },
    section: function (state, section) {
      var hash = window.location.hash.slice(1).split('/');

      hash[0] = section;

      window.location.hash = hash.join('/');
    },
    'toggle-debug': function (state) {
      var debug = !app.data.debug;

      return Object.assign({}, state,
        {debug: debug});
    },
    'toggle-logo': function (state) {
      var logo = !app.data.logo;

      return Object.assign({}, state,
        {logo: logo});
    },
    'add-text': function (state, ref) {
      var type = ref.type;
      var text = ref.text;

      return Object.assign({}, state,
        {editable: state.editable.concat(
          {
            id: id++,
            type: type,
            text: text
          }
        )});
    },
    'remove-text': function (state, id) {
      return Object.assign({}, state,
        {editable: state.editable.filter(function (item) {
          return item.id !== id;
        })});
    }
  };
};

var data = {
  sections: [
    { id: '', name: 'Home' },
    { id: 'info', name: 'Info' },
    { id: 'fiddle', name: 'Fiddle' }
  ],
  editable: []
};

var app = new App(data);

mount(document.body, app);

api(app, actions(app));

app.recoverData();
app.startRoute();

}());
