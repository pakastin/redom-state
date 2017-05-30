(function () {
'use strict';

var style = {};

document && (style = document.createElement('p').style);

var HASH = '#'.charCodeAt(0);
var DOT = '.'.charCodeAt(0);

function createElement (query, ns) {
  var tag;
  var id;
  var className;

  var mode = 0;
  var start = 0;

  for (var i = 0; i <= query.length; i++) {
    var char = query.charCodeAt(i);

    if (char === HASH || char === DOT || !char) {
      if (mode === 0) {
        if (i === 0) {
          tag = 'div';
        } else if (!char) {
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
    if (ns) {
      element.setAttribute('class', className);
    } else {
      element.className = className;
    }
  }

  return element;
}

var hookNames = ['onmount', 'onunmount'];

function mount (parent, child, before) {
  var parentEl = getEl(parent);
  var childEl = getEl(child);

  if (child === childEl && childEl.__redom_view) {
    // try to look up the view if not provided
    child = childEl.__redom_view;
  }

  if (child !== childEl) {
    childEl.__redom_view = child;
  }

  var wasMounted = childEl.__redom_mounted;
  var oldParent = childEl.parentNode;

  if (wasMounted && (oldParent !== parentEl)) {
    doUnmount(child, childEl, oldParent);
  }

  if (before) {
    parentEl.insertBefore(childEl, getEl(before));
  } else {
    parentEl.appendChild(childEl);
  }

  doMount(child, childEl, parentEl, oldParent);

  return child;
}

function unmount (parent, child) {
  var parentEl = parent.el || parent;
  var childEl = child.el || child;

  if (child === childEl && childEl.__redom_view) {
    // try to look up the view if not provided
    child = childEl.__redom_view;
  }

  doUnmount(child, childEl, parentEl);

  parentEl.removeChild(childEl);

  return child;
}

function doMount (child, childEl, parentEl, oldParent) {
  var hooks = childEl.__redom_lifecycle || (childEl.__redom_lifecycle = {});
  var remount = (parentEl === oldParent);
  var hooksFound = false;

  for (var i = 0; i < hookNames.length; i++) {
    var hookName = hookNames[i];

    if (!remount && (child !== childEl) && (hookName in child)) {
      hooks[hookName] = (hooks[hookName] || 0) + 1;
    }
    if (hooks[hookName]) {
      hooksFound = true;
    }
  }

  if (!hooksFound) {
    return;
  }

  var traverse = parentEl;
  var triggered = false;

  if (remount || (!triggered && (traverse && traverse.__redom_mounted))) {
    trigger(childEl, remount ? 'onremount' : 'onmount');
    triggered = true;
  }

  if (remount) {
    return;
  }

  while (traverse) {
    var parent = traverse.parentNode;
    var parentHooks = traverse.__redom_lifecycle || (traverse.__redom_lifecycle = {});

    for (var hook in hooks) {
      parentHooks[hook] = (parentHooks[hook] || 0) + hooks[hook];
    }

    if (!triggered && (traverse === document || (parent && parent.__redom_mounted))) {
      trigger(traverse, remount ? 'onremount' : 'onmount');
      triggered = true;
    }

    traverse = parent;
  }
}

function doUnmount (child, childEl, parentEl) {
  var hooks = childEl.__redom_lifecycle;

  if (!hooks) {
    return;
  }

  var traverse = parentEl;

  if (childEl.__redom_mounted) {
    trigger(childEl, 'onunmount');
  }

  while (traverse) {
    var parentHooks = traverse.__redom_lifecycle || (traverse.__redom_lifecycle = {});
    var hooksFound = false;

    for (var hook in hooks) {
      if (parentHooks[hook]) {
        parentHooks[hook] -= hooks[hook];
      }
      if (parentHooks[hook]) {
        hooksFound = true;
      }
    }

    if (!hooksFound) {
      traverse.__redom_lifecycle = null;
    }

    traverse = traverse.parentNode;
  }
}

function trigger (el, eventName) {
  if (eventName === 'onmount') {
    el.__redom_mounted = true;
  } else if (eventName === 'onunmount') {
    el.__redom_mounted = false;
  }

  var hooks = el.__redom_lifecycle;

  if (!hooks) {
    return;
  }

  var view = el.__redom_view;
  var hookCount = 0;

  view && view[eventName] && view[eventName]();

  for (var hook in hooks) {
    if (hook) {
      hookCount++;
    }
  }

  if (hookCount) {
    var traverse = el.firstChild;

    while (traverse) {
      var next = traverse.nextSibling;

      trigger(traverse, eventName);

      traverse = next;
    }
  }
}

function setStyle (view, arg1, arg2) {
  var el = getEl(view);

  if (arg2 !== undefined) {
    el.style[arg1] = arg2;
  } else if (isString(arg1)) {
    el.setAttribute('style', arg1);
  } else {
    for (var key in arg1) {
      setStyle(el, key, arg1[key]);
    }
  }
}

function setAttr (view, arg1, arg2) {
  var el = getEl(view);
  var isSVG = el instanceof window.SVGElement;

  if (arg2 !== undefined) {
    if (arg1 === 'style') {
      setStyle(el, arg2);
    } else if (isSVG && isFunction(arg2)) {
      el[arg1] = arg2;
    } else if (!isSVG && (arg1 in el || isFunction(arg2))) {
      el[arg1] = arg2;
    } else {
      el.setAttribute(arg1, arg2);
    }
  } else {
    for (var key in arg1) {
      setAttr(el, key, arg1[key]);
    }
  }
}

var text = function (str) { return document.createTextNode(str); };

function parseArguments (element, args) {
  for (var i = 0; i < args.length; i++) {
    var arg = args[i];

    if (arg !== 0 && !arg) {
      continue;
    }

    // support middleware
    if (typeof arg === 'function') {
      arg(element);
    } else if (isString(arg) || isNumber(arg)) {
      element.appendChild(text(arg));
    } else if (isNode(getEl(arg))) {
      mount(element, arg);
    } else if (arg.length) {
      parseArguments(element, arg);
    } else if (typeof arg === 'object') {
      setAttr(element, arg);
    }
  }
}

var ensureEl = function (parent) { return isString(parent) ? html$1(parent) : getEl(parent); };
var getEl = function (parent) { return (parent.nodeType && parent) || (!parent.el && parent) || getEl(parent.el); };

var isString = function (a) { return typeof a === 'string'; };
var isNumber = function (a) { return typeof a === 'number'; };
var isFunction = function (a) { return typeof a === 'function'; };

var isNode = function (a) { return a && a.nodeType; };

var htmlCache = {};

var memoizeHTML = function (query) { return htmlCache[query] || (htmlCache[query] = createElement(query)); };

function html$1 (query) {
  var arguments$1 = arguments;

  var args = [], len = arguments.length - 1;
  while ( len-- > 0 ) { args[ len ] = arguments$1[ len + 1 ]; }

  var element;

  if (isString(query)) {
    element = memoizeHTML(query).cloneNode(false);
  } else if (isNode(query)) {
    element = query.cloneNode(false);
  } else {
    throw new Error('At least one argument required');
  }

  parseArguments(element, args);

  return element;
}

html$1.extend = function (query) {
  var clone = memoizeHTML(query);

  return html$1.bind(this, clone);
};

var el = html$1;

function setChildren (parent, children) {
  if (children.length === undefined) {
    return setChildren(parent, [children]);
  }

  var parentEl = getEl(parent);
  var traverse = parentEl.firstChild;

  for (var i = 0; i < children.length; i++) {
    var child = children[i];

    if (!child) {
      continue;
    }

    var childEl = getEl(child);

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
  this.el = ensureEl(parent);

  if (key) {
    this.lookup = {};
  }
}

List.extend = function (parent, View, key, initData) {
  return List.bind(List, parent, View, key, initData);
};

list.extend = List.extend;

List.prototype.update = function (data) {
  if ( data === void 0 ) { data = []; }

  var View = this.View;
  var key = this.key;
  var functionKey = isFunction(key);
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
    var el = view.el;
    if (el.__redom_list) {
      el = el.el;
    }
    el.__redom_view = view;
    view.update && view.update(item, i, data);
  }

  setChildren(this, newViews);

  if (key) {
    this.lookup = newLookup;
  }
  this.views = newViews;
};

function router (parent, Views, initData) {
  return new Router(parent, Views, initData);
}

var Router = function Router (parent, Views, initData) {
  this.el = ensureEl(parent);
  this.Views = Views;
  this.initData = initData;
};
Router.prototype.update = function update (route, data) {
  if (route !== this.route) {
    var Views = this.Views;
    var View = Views[route];

    this.view = View && new View(this.initData, data);
    this.route = route;

    setChildren(this.el, [ this.view ]);
  }
  this.view && this.view.update && this.view.update(data, route);
};

var SVG = 'http://www.w3.org/2000/svg';

var svgCache = {};

var memoizeSVG = function (query) { return svgCache[query] || (svgCache[query] = createElement(query, SVG)); };

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

/* global requestAnimationFrame */

var App = function App (data) {
  this.el = el('.app',
    this.menu = new Menu(),
    this.content = new Content(),
    this.debug = new Debug(this)
  );

  this.data = data;
};
App.prototype.update = function update () {
    var this$1 = this;

  // debounce to next animationframe
  // (if there's multiple updates / animationframe, batch them and only do one)
  if (!this.rendering) {
    this.rendering = requestAnimationFrame(function () {
      this$1.rendering = null;

      this$1.menu.update(this$1.data);
      this$1.content.update(this$1.data);
      this$1.debug.update(this$1.data);
    });
    window.localStorage && window.localStorage.setItem('redom-state', JSON.stringify(this.data));
  }
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

var actions = function () {
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
      var debug = !state.debug;

      return Object.assign({}, state,
        {debug: debug});
    },
    'toggle-logo': function (state) {
      var logo = !state.logo;

      return Object.assign({}, state,
        {logo: logo});
    },
    'add-text': function (state, ref) {
      var type = ref.type;
      var text = ref.text;

      var editable = state.editable;

      return Object.assign({}, state,
        {editable: editable.concat(
          {
            id: id++,
            type: type,
            text: text
          }
        )});
    },
    'remove-text': function (state, id) {
      var editable = state.editable;

      return Object.assign({}, state,
        {editable: editable.filter(function (item) {
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
