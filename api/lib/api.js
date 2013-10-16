/*
 * ExoBrowser: api.js
 * 
 * (c) Copyright Stanislas Polu 2013. All rights reserved.
 * (see LICENSE file)
 *
 * @author: spolu
 *
 * @log:
 * 2013-09-26 spolu   ExoSession support
 * 2013-09-20 spolu   Move to `api/`
 * 2013-08-12 spolu   Add name to browser
 * 2013-08-11 spolu   Creation
 */

var common = require('./common.js');
var events = require('events');
var async = require('async');
var path = require('path');
var mkdirp = require('mkdirp');

var _exo_browser = apiDispatcher.requireExoBrowser();

// ### data_path
//
// Computes a default path for storing app data for the current platform
// ```
// @app_name {string} the app name to use
// ```
exports.data_path = function(app_name) {
  var data_path;
  switch (process.platform) {
    case 'win32':
    case 'win64': {
      data_path = process.env.LOCALAPPDATA || process.env.APPDATA;
      if (!data_path) { 
        throw new Error("Couldn't find the base application data path"); 
      }
      data_path = path.join(data_path, app_name);
    }
    break;
    case 'darwin': {
      data_path = process.env.HOME;
      if (!data_path) { 
        throw new Error("Couldn't find the base application data path"); 
      }
      data_path = path.join(data_path, 
                            'Library', 'Application Support', app_name);
      break;
    }
    case 'linux': {
      data_path = process.env.HOME;
      if (!data_path) { 
        throw new Error("Couldn't find the base application data path"); 
      }
      data_path = path.join(data_path, '.config', app_name);
      break;
    }
    default: {
      throw new Error("Can't compute application data path for platform: " + 
                      process.platform);
      break;
    }
  }
  return data_path;
};


// ## exo_session
//
// Wrapper around the internal API representation of an ExoSession.
//
// An ExoSession represents all the context required by the browser to display
// a web papge. Two ExoFrames displayed with separate ExoSessions are perfectly
// independent (unless they share local HTML5 Storage)
//
// The `path` arguments is expected
// ```
// @spec { [path], [off_the_record], [cookie_handlers] }
// ```
var exo_session = function(spec, my) {
  var _super = {};
  my = my || {};
  spec = spec || {};

  my.internal = null;
  my.ready = false;
  my.killed = false;
  
  my.off_the_record = 
    (typeof spec.off_the_record === 'boolean') ? spec.off_the_record : true;
  my.path = spec.path || exports.data_path('exo_browser_api');

  my.cookie_handlers = {
    load_all: null,                 /* load_all(cb_(cookies)) */
    load_for_key: null,             /* load_for_key(key, cb_(cookies)); */
    flush: null,                    /* flush(cb_()); */
    add: null,                      /* add(c); */
    remove: null,                   /* remove(c); */
    update_access_time: null,       /* update_access_time(c); */
    force_keep_session_state: null  /* force_keep_session_state(); */
  };


  //
  // #### _public_
  //
  var kill;                  /* kill(); */
  var set_cookie_handlers;   /* set_cookie_handlers({}); */
  var add_visited_link;      /* add_visited_link(url); */
  var clear_visited_links;   /* clear_visited_links(); */
  var clear_all_data;        /* clear_all_data(); */

  //
  // #### _protected_
  //
  var pre;                 /* pre(cb_); */

  //
  // #### _private_
  //
  var init;                /* init(); */

  //
  // #### _that_
  //
  var that = new events.EventEmitter();

  // ### pre
  //
  // Takes care of the syncronization. If the session is not yet ready it will
  // wait on the `ready` event.
  // ```
  // @cb_ {function(err)}
  // ```
  pre = function(cb_) {
    if(my.killed) {
      return cb_(new Error('Session was killed: ' + my.name));
    }
    if(!my.ready) {
      that.on('ready', function() {
        return cb_();
      });
    }
    else {
      return cb_();
    }
  };

  // ### kill
  //
  // Deletes the internal exo session to let the object get GCed
  // ```
  // @cb_    {functio(err)}
  // ```
  kill = function(cb_) {
    pre(function(err) {
      if(err) {
        if(cb_) return cb_(err);
      }
      else {
        my.killed = true;
        my.ready = false;
        delete my.internal;
        that.removeAllListeners();
      }
    });
  };

  // ### set_cookie_handlers
  //
  // ```
  // @handlers {object} dictionary of handlers
  // ```
  set_cookie_handlers = function(handlers) {
    my.cookie_handlers = {
      load_for_key: handlers.load_for_key || null,
      flush: handlers.flush || null,
      add: handlers.add || null,
      remove: handlers.remove || null,
      update_access_time: handlers.update_acccess_time || null,
      force_keep_session_state: handlers.force_keep_session_state || null
    };
  };

  // ### add_visited_link
  //
  // Adds an URL to the list of visited links (stored on disk if not of the 
  // record)
  // ```
  // @url {string} the url to load
  // @cb_ {function(err)} [optional]
  // ```
  add_visited_link = function(url, cb_) {
    pre(function(err) {
      if(err) {
        if(cb_) return cb_(err);
      }
      else {
        my.internal._addVisitedLink(url, function() {
          if(cb_) return cb_();
        });
      }
    });
  };

  // ### clear_visited_links
  //
  // Clears all visited links and destroy the file system storage if it exists.
  // ```
  // @cb_ {function(err)} [optional]
  // ```
  clear_visited_links = function(cb_) {
    pre(function(err) {
      if(err) {
        if(cb_) return cb_(err);
      }
      else {
        my.internal._clearVisitedLinks(function() {
          if(cb_) return cb_();
        });
      }
    });
  };

  // ### clear_all_data
  //
  // Clears all persisted data
  // ```
  // @cb_ {function(err)} [optional]
  // ```
  clear_all_data = function(cb_) {
    pre(function(err) {
      if(err) {
        if(cb_) return cb_(err);
      }
      else {
        my.internal._clearAllData(function() {
          if(cb_) return cb_();
        });
      }
    });
  };

  // ### init
  //
  // Runs initialization procedure.
  init = function() {
    var finish = function() {
      my.internal._setCookiesLoadForKeyHandler(function(key, rid, cb_) {
        if(my.cookie_handlers.load_for_key) {
          my.cookie_handlers.load_for_key(key, function(cookies) {
            return (cb_.bind(my.internal, rid, cookies))();
          });
        }
        else {
          return (cb_.bind(my.internal, rid, []))();
        }
      });
      my.internal._setCookiesFlushHandler(function(rid, cb_) {
        if(my.cookie_handlers.flush) {
          my.cookie_handlers.flush(function() {
            return (cb_.bind(my.internal, rid))();
          });
        }
        else {
          return (cb_.bind(my.internal, rid))();
        }
      });

      my.internal._setCookiesAddCallback(function(cc) {
        if(my.cookie_handlers.add) {
          my.cookie_handlers.add(cc);
        }
      });
      my.internal._setCookiesDeleteCallback(function(cc) {
        if(my.cookie_handlers.remove) {
          my.cookie_handlers.remove(cc);
        }
      });
      my.internal._setCookiesUpdateAccessTimeCallback(function(cc) {
        if(my.cookie_handlers.update_access_time) {
          my.cookie_handlers.update_access_time(cc);
        }
      });
      my.internal._setCookiesForceKeepSessionStateCallback(function(cc) {
        if(my.cookie_handlers.force_keep_session_state) {
          my.cookie_handlers.force_keep_session_state();
        }
      });

      my.ready = true;
      that.emit('ready');
    };

    set_cookie_handlers(spec.cookie_handlers || {});

    var create = function() {
      if(my.internal) {
        return finish();
      }
      else {
        _exo_browser._createExoSession({
          path: my.path,
          off_the_record: my.off_the_record
        }, function(s) {
          my.internal = s;
          return finish();
        });
      }
    };

    if(!my.off_the_record) {
      mkdirp(my.path, function(err) {
        if(err) {
          /* We can't do much more than throwing the error as there is no       */
          /* handler to pass it to. It would be a bad idea to start the browser */
          /* without a proper data directory setup.                             */
          throw err;
        }
        else {
          create();
        }
      });
    }
    else {
      create();
    }
  };


  init();

  common.method(that, 'kill', kill, _super);
  common.method(that, 'pre', pre, _super);

  common.method(that, 'set_cookie_handlers', set_cookie_handlers, _super);
  common.method(that, 'add_visited_link', add_visited_link, _super);
  common.method(that, 'clear_visited_links', clear_visited_links, _super);

  common.method(that, 'clear_all_data', clear_all_data, _super);

  /* Should only be called by exo_frame. */
  common.getter(that, 'internal', my, 'internal');

  common.getter(that, 'off_the_record', my, 'off_the_record');
  common.getter(that, 'path', my, 'path');

  return that;
};

exports.exo_session = exo_session;
exports.default_session = function() {
  if(!exports._default_session) {
    exports._default_session = exo_session({});
  }
  return exports._default_session;
};



exports.NOTYPE_FRAME = 0;
exports.CONTROL_FRAME = 1;
exports.PAGE_FRAME = 2;

exports.frame_count = 0;

// ## exo_frame
//
// Wrapper around the internal API representation of an ExoFrame. It also serves
// as a proxy on the internal state of the ExoFrame.
//
// ExoFrames are named objects. Their names are expected to be uniques. If no
// name is specifed a statically incremented counter is used to provide a unique
// human readable name.
//
// The `url` argument is expected.
// ```
// @spec { url, [name], [session] | internal }
// ```
var exo_frame = function(spec, my) {
  var _super = {};
  my = my || {};
  spec = spec || {};

  my.internal = spec.internal || null;
  my.ready = false;
  my.killed = false;

  my.url = spec.url || '';
  my.name = spec.name || ('fr-' + (exports.frame_count++));
  my.session = spec.session || exports.default_session();

  my.visible = false;
  my.parent = null;
  my.type = exports.NOTYPE_FRAME;
  my.loading = 0;
  my.title = '';

  my.find_rid = 0;
  my.find = {};

  //
  // #### _public_
  //
  var load_url;            /* load_url(url, [cb_]); */
  var go_back_or_forward;  /* go_back_or_forward(offset, [cb_]); */
  var reload;              /* reload([cb_]); */
  var stop;                /* stop([cb_]); */ 
  var undo;                /* undo([cb_]); */
  var redo;                /* redo([cb_]); */
  var cut_selection;       /* cut_selection([cb_]); */
  var copy_selection;      /* copy_selection([cb_]); */
  var paste;               /* paste([cb_]); */
  var delete_selection;    /* delete_selection([cb_]); */
  var select_all;          /* select_all([cb_]); */
  var unselect;            /* unselect([cb_]); */
  var focus;               /* focus([cb_]); */
  var find;                /* find(text, forward, case, next, [cb_]); */
  var find_stop;           /* find_stop(action, [cb_]); */

  var kill;                /* kill(); */

  //
  // #### _protected_
  //
  var pre;                 /* pre(cb_); */

  //
  // #### _private_
  //
  var init;                /* init(); */

  //
  // #### _that_
  //
  var that = new events.EventEmitter();


  // ### pre
  //
  // Takes care of the syncronization. If the frame is not yet ready it will
  // wait on the `ready` event.
  // ```
  // @cb_ {function(err)}
  // ```
  pre = function(cb_) {
    if(my.killed) {
      return cb_(new Error('Frame was killed: ' + my.name));
    }
    if(!my.ready) {
      that.on('ready', function() {
        return cb_();
      });
    }
    else {
      return cb_();
    }
  };

  // ### load_url
  //
  // Loads the specified url within this frame.
  // ```
  // @url {string} the url to load
  // @cb_ {function(err)} [optional]
  // ```
  load_url = function(url, cb_) {
    pre(function(err) {
      if(err) {
        if(cb_) return cb_(err);
      }
      else {
        my.internal._loadURL(url, function() {
          /* TODO(spolu): Figure out if we change the URL here or from the */
          /* browser on `frame_navigate` event?                            */
          if(cb_) return cb_();
        });
      }
    });
  };

  // ### go_back_or_forward
  //
  // Goes back or forward in history for that frame
  // ```
  // @offset {number} where we go in history
  // @cb_    {functio(err)}
  // ```
  go_back_or_forward = function(offset, cb_) {
    pre(function(err) {
      if(err) {
        if(cb_) return cb_(err);
      }
      else {
        my.internal._goBackOrForward(offset, function() {
          if(cb_) return cb_();
        });
      }
    });
  };

  // ### reload
  //
  // Reloads the frame
  // ```
  // @cb_    {functio(err)}
  // ```
  reload = function(cb_) {
    pre(function(err) {
      if(err) {
        if(cb_) return cb_(err);
      }
      else {
        my.internal._reload(function() {
          if(cb_) return cb_();
        });
      }
    });
  };

  // ### stop
  //
  // Stops the frame
  // ```
  // @cb_    {functio(err)}
  // ```
  stop = function(cb_) {
    pre(function(err) {
      if(err) {
        if(cb_) return cb_(err);
      }
      else {
        my.internal._stop(function() {
          if(cb_) return cb_();
        });
      }
    });
  };

  // ### undo
  //
  // Edit actions `undo`
  // ```
  // @cb_    {functio(err)}
  // ```
  undo = function(cb_) {
    pre(function(err) {
      if(err) {
        if(cb_) return cb_(err);
      }
      else {
        my.internal._undo(function() {
          if(cb_) return cb_();
        });
      }
    });
  };

  // ### redo
  //
  // Edit actions `redo`
  // ```
  // @cb_    {functio(err)}
  // ```
  redo = function(cb_) {
    pre(function(err) {
      if(err) {
        if(cb_) return cb_(err);
      }
      else {
        my.internal._redo(function() {
          if(cb_) return cb_();
        });
      }
    });
  };

  // ### cut_selection
  //
  // Edit actions `cut`. Cuts the selection.
  // ```
  // @cb_    {functio(err)}
  // ```
  cut_selection = function(cb_) {
    pre(function(err) {
      if(err) {
        if(cb_) return cb_(err);
      }
      else {
        my.internal._cutSelection(function() {
          if(cb_) return cb_();
        });
      }
    });
  };

  // ### copy_selection
  //
  // Edit actions `copy`. Copies the selection (clipboard)
  // ```
  // @cb_    {functio(err)}
  // ```
  copy_selection = function(cb_) {
    pre(function(err) {
      if(err) {
        if(cb_) return cb_(err);
      }
      else {
        my.internal._copySelection(function() {
          if(cb_) return cb_();
        });
      }
    });
  };

  // ### paste
  //
  // Edit actions `paste`
  // ```
  // @cb_    {functio(err)}
  // ```
  paste = function(cb_) {
    pre(function(err) {
      if(err) {
        if(cb_) return cb_(err);
      }
      else {
        my.internal._paste(function() {
          if(cb_) return cb_();
        });
      }
    });
  };

  // ### delete_selection
  //
  // Edit actions `delete`
  // ```
  // @cb_    {functio(err)}
  // ```
  delete_selection = function(cb_) {
    pre(function(err) {
      if(err) {
        if(cb_) return cb_(err);
      }
      else {
        my.internal._deleteSelection(function() {
          if(cb_) return cb_();
        });
      }
    });
  };
  
  // ### select_all
  //
  // Edit actions `select_all`
  // ```
  // @cb_    {functio(err)}
  // ```
  select_all = function(cb_) {
    pre(function(err) {
      if(err) {
        if(cb_) return cb_(err);
      }
      else {
        my.internal._selectAll(function() {
          if(cb_) return cb_();
        });
      }
    });
  };
  
  // ### unselect
  //
  // Edit actions `unselect`
  // ```
  // @cb_    {functio(err)}
  // ```
  unselect = function(cb_) {
    pre(function(err) {
      if(err) {
        if(cb_) return cb_(err);
      }
      else {
        my.internal._unselect(function() {
          if(cb_) return cb_();
        });
      }
    });
  };


  // ### focus
  //
  // Focuses the frame
  // ```
  // @cb_    {functio(err)}
  // ```
  focus = function(cb_) {
    pre(function(err) {
      if(err) {
        if(cb_) return cb_(err);
      }
      else {
        my.internal._focus(function() {
          if(cb_) return cb_();
        });
      }
    });
  };

  // ### find
  //
  // Find text in frame html
  // ```
  // @text      {string} the search test
  // @forward   {boolean} search forward (backward otherwise)
  // @sensitive {boolean} case sensitive (insensitive otherwise)
  // @next      {boolean} followup request (first one otherwise)
  // @cb_       {functio(err)}
  // ```
  find = function(text, forward, sensitive, next, cb_) {
    pre(function(err) {
      if(err) {
        if(cb_) return cb_(err);
      }
      else {
        var rid = next ? my.find[text] : ++my.find_rid;
        my.find[text] = rid;
        my.internal._find(rid, text, forward, sensitive, next, function() {
          if(cb_) return cb_();
        });
      }
    });
  };

  // ### find_stop
  //
  // Stop finding in frame html
  // ```
  // @action {string} the stop find action type ('clear'|'keep'|'activate')
  find_stop = function(action, cb_) {
    pre(function(err) {
      if(err) {
        if(cb_) return cb_(err);
      }
      else {
        my.internal._stopFinding(action, function() {
          if(cb_) return cb_();
        });
      }
    });
  };

  // ### kill
  //
  // Deletes the internal exo frame to let the object get GCed
  // ```
  // @cb_    {functio(err)}
  // ```
  kill = function(cb_) {
    pre(function(err) {
      if(err) {
        if(cb_) return cb_(err);
      }
      else {
        my.killed = true;
        my.ready = false;
        delete my.internal;
        that.removeAllListeners();
      }
    });
  };


  // ### init
  //
  // Runs initialization procedure.
  init = function() {
    var finish = function() {
      my.internal._setFaviconUpdateCallback(function(favicons) {
        if(my.parent) {
          my.parent.emit('frame_favicon_update', that, favicons);
        }
      });
      my.internal._setLoadFailCallback(function(url, error_code, error_desc) {
        if(my.parent) {
          my.parent.emit('frame_load_fail', that, url, error_code, error_desc);
        }
      });
      my.internal._setLoadFinishCallback(function(url) {
        if(my.parent) {
          my.parent.emit('frame_load_finish', that, url);
        }
      });
      my.internal._setLoadingStartCallback(function() {
        if(my.parent) {
          my.loading++;
          my.parent.emit('frame_loading_start', that);
        }
      });
      my.internal._setLoadingStopCallback(function() {
        if(my.parent) {
          my.loading--;
          my.parent.emit('frame_loading_stop', that);
        }
      });

      my.ready = true;
      that.emit('ready');
    };

    if(my.internal) {
      my.internal._name(function(name) {
        my.name = name;
        return finish();
      });
    }
    else {
      my.session.pre(function(err) {
        if(err) {
          /* We can't do much more than throwing the error as there is no   */
          /* handler to pass it to. This means we've used a killed session, */
          /* things must have gone bad and throwing an error is a way to    */
          /* express that.                                                  */
          throw err;
        }
        else {
          _exo_browser._createExoFrame({
            name: my.name,
            url: my.url,
            session: my.session.internal()
          }, function(f) {
            my.internal = f;
            return finish();
          });
        }
      });
    }
  };


  init();

  common.method(that, 'kill', kill, _super);
  common.method(that, 'pre', pre, _super);

  common.method(that, 'load_url', load_url, _super);
  common.method(that, 'go_back_or_forward', go_back_or_forward, _super);
  common.method(that, 'reload', reload, _super);
  common.method(that, 'stop', stop, _super);
  
  common.method(that, 'undo', undo, _super);
  common.method(that, 'redo', redo, _super);
  common.method(that, 'cut_selection', cut_selection, _super);
  common.method(that, 'copy_selection', copy_selection, _super);
  common.method(that, 'paste', paste, _super);
  common.method(that, 'delete_selection', delete_selection, _super);
  common.method(that, 'select_all', select_all, _super);
  common.method(that, 'unselect', unselect, _super);

  common.method(that, 'focus', focus, _super);
  common.method(that, 'find', find, _super);
  common.method(that, 'find_stop', find_stop, _super);

  common.getter(that, 'url', my, 'url');
  common.getter(that, 'name', my, 'name');
  common.getter(that, 'visible', my, 'visible');
  common.getter(that, 'ready', my, 'ready');
  common.getter(that, 'parent', my, 'parent');
  common.getter(that, 'type', my, 'type');
  common.getter(that, 'loading', my, 'loading');
  common.getter(that, 'title', my, 'title');

  /* Should only be called by exo_browser. */
  common.getter(that, 'internal', my, 'internal');

  common.setter(that, 'url', my, 'url');
  common.setter(that, 'name', my, 'name');
  common.setter(that, 'visible', my, 'visible');
  common.setter(that, 'ready', my, 'ready');
  common.setter(that, 'parent', my, 'parent');
  common.setter(that, 'type', my, 'type');
  common.setter(that, 'title', my, 'title');

  return that;
};

exports.exo_frame = exo_frame;



exports._exo_browsers = {};
exports.exo_browser = function(name) {
  return exports._exo_browsers[name] || null;
};

exports.TOP_CONTROL = 1;
exports.BOTTOM_CONTROL = 2;
exports.LEFT_CONTROL = 3;
exports.RIGHT_CONTROL = 4;

exports.browser_count = 0;


// ## exo_browser
//
// Wrapper around the internal API representation of an ExoBrowser. It also
// serves as a proxy on the internal state of the ExoBrowser, event broker
// for all events related to it (its and the ones from the frames attached to
// it) and takes care of some synchronization to provided an facilitated use / 
// syntax. In particular it makes sure that all objects that are alive (not 
// killed) are not garbage collected.
//
// ExoFrames are named objects. Their names are expected to be uniques. If no
// name is specifed a statically incremented counter is used to provide a unique
// human readable name.
// ```
// @spec { size, [name] }
// ```
var exo_browser = function(spec, my) {
  var _super = {};
  my = my || {};
  spec = spec || {};

  my.internal = null;

  my.ready = false;
  my.killed = false;
  my.size = spec.size || [800, 600];
  my.name = spec.name || ('br-' + (exports.frame_count++));

  my.frames = {};
  my.pages = {};

  my.controls = {};
  my.controls[exports.TOP_CONTROL] = null;
  my.controls[exports.BOTTOM_CONTROL] = null;
  my.controls[exports.LEFT_CONTROL] = null;
  my.controls[exports.RIGHT_CONTROL] = null;

  my.control_dimensions = {};
  my.control_dimensions[exports.TOP_CONTROL] = 0;
  my.control_dimensions[exports.BOTTOM_CONTROL] = 0;
  my.control_dimensions[exports.LEFT_CONTROL] = 0;
  my.control_dimensions[exports.RIGHT_CONTROL] = 0;


  //
  // #### _public_
  //
  var kill;                  /* kill([cb_]); */
  var focus;                 /* focus([cb_]); */
  var maximize;              /* maximize([cb_]); */

  var set_control;           /* set_control(type, frame, [cb_]); */
  var unset_control;         /* unset_control(type, [cb_]); */
  var set_control_dimension; /* set_control_dimension(type, size, [cb_]); */

  var add_page;              /* add_page(frame, [cb_]); */
  var remove_page;           /* remove_page(frame, [cb_]); */
  var show_page;             /* show_page(frame, [cb_]); */

  //
  // #### _private_
  //
  var init;     /* init(); */
  var pre;      /* pre(cb_); */

  //
  // #### _that_
  //
  var that = new events.EventEmitter();

  // ### pre
  //
  // Takes care of the syncronization. If the browser is not yet ready it will
  // wait on the `ready` event. If the browser is killed it will return an error
  // ```
  // @cb_ {function(err)}
  // ```
  pre = function(cb_) {
    if(my.killed)
      return cb_(new Error('Browser already killed: ' + my.name));
    else if(!my.ready) {
      that.on('ready', function() {
        return cb_();
      });
    }
    else {
      return cb_();
    }
  };

  // ### set_control
  //
  // Adds the specified as a control for the given type
  // ```
  // @type  {control_type} the type (see exports constants)
  // @frame {exo_frame} the frame to set as control
  // @cb_   {function(err)} [optional]
  // ```
  set_control = function(type, frame, cb_) {
    /* We take care of "synchronization" */
    async.parallel([ pre, frame.pre ], function(err) {
      if(err) {
        if(cb_) return cb_(err);
      }
      else {
        my.internal._setControl(type, frame.internal(), function() {
          frame.set_parent(that);
          frame.set_type(exports.CONTROL_TYPE);
          my.frames[frame.name()] = frame;
          my.controls[type] = frame;
          if(my.control_dimensions[type] === 0) {
            my.controls[type].set_visible(false);
          }
          else {
            my.controls[type].set_visible(true);
          }
          if(cb_) return cb_();
        });
      }
    });
  };

  // ### unset_control
  //
  // Unsets the control specified by type (returns its frame if it was set)
  // ```
  // @type  {control_type} the type (see exports constants)
  // @cb_   {function(err, frame)} [optional]
  // ```
  unset_control = function(type, cb_) {
    pre(function(err) {
      if(err) {
        if(cb_) return cb_(err);
      }
      else {
        my.internal._unsetControl(type, function() {
          var control = my.controls[type];
          control.set_parent(that);
          control.set_type(exports.NO_TYPE);
          control.set_visible(false);
          my.controls[type] = null;
          my.control_dimensions[type] = 0;
          delete my.frames[control.name()];
          if(cb_) return cb_(null, control);
        });
      }
    });
  };

  // ### set_control_dimension
  //
  // Sets the given size as pixels as canonical dimension for the control
  // ```
  // @type  {Number} the type (see exports contants)
  // @size  {Number} the size in pixels
  // @cb_   {function(err, frame)} [optional]
  // ```
  set_control_dimension = function(type, size, cb_) {
    pre(function(err) {
      if(err) {
        if(cb_) return cb_(err);
      }
      else {
        my.internal._setControlDimension(type, size, function() {
          my.control_dimensions[type] = size;
          if(my.control_dimensions[type] === 0) {
            my.controls[type].set_visible(false);
          }
          else {
            my.controls[type].set_visible(true);
          }
          if(cb_) return cb_(null, my.controls[type]);
        });
      }
    });
  };

  // ### add_page
  //
  // Adds a page to the browser. The visible page is not altered by this method
  // ```
  // @frame {exo_frame} the frame to add as a page
  // @cb_   {funciton(err)
  // ```
  add_page = function(frame, cb_) {
    /* We take care of "synchronization" */
    async.parallel([ pre, frame.pre ], function(err) {
      if(err) {
        if(cb_) return cb_(err);
      }
      else {
        my.internal._addPage(frame.internal(), function() {
          frame.set_parent(that);
          frame.set_type(exports.PAGE_TYPE);
          my.pages[frame.name()] = frame;
          my.frames[frame.name()] = frame;
          if(cb_) return cb_();
        });
      }
    });
  };

  // ### remove_page
  //
  // Removes the specified page
  // ```
  // @frame {exo_frame} the frame to add as a page
  // @cb_   {funciton(err)
  // ```
  remove_page = function(frame, cb_) {
    /* We take care of "synchronization" */
    async.parallel([ pre, frame.pre ], function(err) {
      if(err) {
        if(cb_) return cb_(err);
      }
      else {
        if(my.frames[frame.name()] !== frame) {
          return cb_(new Error('Frame not known: ' + frame.name()));
        }
        my.internal._removePage(frame.name(), function() {
          frame.set_visible(false);
          frame.set_parent(null);
          frame.set_type(exports.NO_TYPE);
          delete my.pages[frame.name()];
          delete my.frames[frame.name()];
          if(cb_) return cb_();
        });
      }
    });
  };

  // ### show_page
  //
  // Shows the provided page in the browser.
  // ```
  // @frame {exo_frame} the frame to add as a page
  // @cb_   {funciton(err)
  // ```
  show_page = function(frame, cb_) {
    /* We take care of "synchronization" */
    async.parallel([ pre, frame.pre ], function(err) {
      if(err) {
        if(cb_) return cb_(err);
      }
      else {
        if(my.frames[frame.name()] !== frame) {
          return cb_(new Error('Frame not known: ' + frame.name()));
        }
        my.internal._showPage(frame.name(), function() {
          for(var name in my.pages) {
            if(my.pages.hasOwnProperty(name)) {
              my.pages[name].set_visible(false);
            }
          }
          frame.set_visible(true);
          if(cb_) return cb_();
        });
      }
    });
  };


  // ### kill
  //
  // Kills the browser, removes it from the internal registry and deletes its
  // internal representation so that the native objects get deleted.
  // ```
  // @cb_ {function(err)} [optional]
  // ```
  kill = function(cb_) {
    pre(function(err) {
      if(err) {
        if(cb_) return cb_(err);
      }
      else {
        /* The `Kill` Callback is going to be called so we should not do  */
        /* anything here, esp. as `KIll` can be called internally (window */
        /* closed).                                                       */
        my.internal._kill(function() {
          if(cb_) return cb_();
        });
      }
    });
  };

  
  // ### focus
  // 
  // Attempts to focus on the browser window depending on what the native
  // platform lets us do.
  // ```
  // @cb_ {function(err)} [optional]
  // ```
  focus = function(cb_) {
    pre(function(err) {
      if(err) {
        if(cb_) return cb_(err);
      }
      else {
        my.internal._focus(function() {
          if(cb_) return cb_();
        });
      }
    });
  };

  // ### maximize
  // 
  // Attempts to maximize the browser window depending on what the native 
  // platform lets us do.
  // ```
  // @cb_ {function(err)} [optional]
  // ```
  maximize = function(cb_) {
    pre(function(err) {
      if(err) {
        if(cb_) return cb_(err);
      }
      else {
        my.internal._maximize(function() {
          if(cb_) return cb_();
        });
      }
    });
  };




  // ### init
  //
  // Runs initialization procedure and adds itself to the internal registry.
  init = function() {
    _exo_browser._createExoBrowser({
      size: my.size
    }, function(b) {
      my.internal = b;
      exports._exo_browsers[my.name] = that;

      my.internal._setOpenURLCallback(function(url, disposition, from) {
        var origin = my.frames[from] || null;
        that.emit('open_url', url, disposition, origin);
      });
      my.internal._setResizeCallback(function(size) {
        my.size = size;
        that.emit('resize', size);
      });
      my.internal._setKillCallback(function() {
        /* `Kill` has been called from here or somewhere else so let's make */
        /* sure we have eveything cleaned up */
        for(var name in my.frames) {
          if(my.frames.hasOwnProperty(name)) {
            my.frames[name].kill();
          }
        }
        my.controls[exports.TOP_CONTROL] = null;
        my.controls[exports.BOTTOM_CONTROL] = null;
        my.controls[exports.LEFT_CONTROL] = null;
        my.controls[exports.RIGHT_CONTROL] = null;
        my.frames = {};
        my.pages = {};

        delete my.internal;
        my.killed = true;
        my.ready = false;
        delete my.internal;
        delete exports._exo_browsers[my.name];
        that.emit('kill');
      });
      my.internal._setFrameCloseCallback(function(from) {
        that.emit('frame_close', my.frames[from]);
      });
      my.internal._setFrameCreatedCallback(function(_frame, disposition, 
                                                    initial_pos, from) {
        var origin = my.frames[from] || null;
        var frame = exo_frame({ internal: _frame });
        frame.on('ready', function() {
          that.emit('frame_created', frame, disposition, initial_pos, origin);
        });
      });
      my.internal._setFrameKeyboardCallback(function(from, event) {
        that.emit('frame_keyboard', my.frames[from], event);
      });
      my.internal._setNavigationStateCallback(function(from, state) {
        state.entries.forEach(function(e) {
          e.url = require('url').parse(e.virtual_url || '');
        });
        that.emit('frame_navigation_state', my.frames[from], state);
      });

      my.ready = true;
      that.emit('ready');
    });
  };


  init();
  
  common.getter(that, 'name', my, 'name');
  common.getter(that, 'ready', my, 'ready');
  common.getter(that, 'killed', my, 'killed');
  common.getter(that, 'internal', my, 'internal');
  common.getter(that, 'size', my, 'size');
  common.getter(that, 'frames', my, 'frames');
  common.getter(that, 'controls', my, 'controls');
  common.getter(that, 'pages', my, 'pages');

  common.method(that, 'kill', kill, _super);

  common.method(that, 'set_control', set_control, _super);
  common.method(that, 'unset_control', unset_control, _super);
  common.method(that, 'set_control_dimension', set_control_dimension, _super);

  common.method(that, 'add_page', add_page, _super);
  common.method(that, 'remove_page', remove_page, _super);
  common.method(that, 'show_page', show_page, _super);

  common.method(that, 'focus', focus, _super);
  common.method(that, 'maximize', maximize, _super);

  return that;
};

exports.exo_browser = exo_browser;

