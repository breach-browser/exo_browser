/*
 * Breach: api.js
 * 
 * (c) Copyright Stanislas Polu 2013. All rights reserved.
 *
 * @author: spolu
 *
 * @log:
 * 2013-08-12 spolu   Add name to browser
 * 2013-08-11 spolu   Creation
 */

var common = require('./common.js');
var events = require('events');
var async = require('async');

var _breach = apiDispatcher.requireBreach();
var factory = common.factory;

exports.NOTYPE_FRAME = 0;
exports.CONTROL_FRAME = 1;
exports.PAGE_FRAME = 2;

exports.frame_count = 0;

//
// ## exo_frame
//
// Wrapper around the internal API representation of an ExoFrame. It alos serves
// as a proxy on the internal state of the ExoFrame.
//
// ExoFrames are named objects. Their names are expected to be uniques. If no
// name is specifed a statically incremented counter is used to provide a unique
// human readable name.
//
// The `url` argument is expected.
//
// ```
// @spec { url, [name] }
// ```
//
var exo_frame = function(spec, my) {
  var _super = {};
  my = my || {};
  spec = spec || {};

  my.internal = null;

  my.url = spec.url || '';
  my.name = spec.name || ('fr-' + (exports.frame_count++));
  my.visible = false;
  my.ready = false;
  my.parent = null;
  my.type = exports.NOTYPE_FRAME;
  my.loading = false;
  my.title = '';

  //
  // #### _public_
  //
  var load_url;            /* load_url(url, [cb_]); */
  var go_back_or_forward;  /* go_back_or_forward(offset, [cb_]); */
  var reload;              /* reload([cb_]); */
  var stop;                /* stop([cb_]); */ 

  //
  // #### _private_
  //
  var init;     /* init(); */
  var pre;      /* pre(cb_); */

  //
  // #### _that_
  //
  var that = new events.EventEmitter();


  //
  // ### pre
  //
  // Takes care of the syncronization. If the frame is not yet ready it will
  // wait on the `ready` event.
  //
  // ```
  // @cb_ {function(err)}
  // ```
  //
  pre = function(cb_) {
    if(!my.ready) {
      that.on('ready', function() {
        return cb_();
      });
    }
    else {
      return cb_();
    }
  };

  //
  // ### load_url
  //
  // Loads the specified url within this frame.
  //
  // ```
  // @url {string} the url to load
  // @cb_ {function(err)} [optional]
  //
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

  //
  // ### go_back_or_forward
  //
  // Goes back or forward in history for that frame
  //
  // ```
  // @offset {number} where we go in history
  // @cb_    {functio(err)}
  // ```
  //
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

  //
  // ### reload
  //
  // Reloads the frame
  //
  // ```
  // @cb_    {functio(err)}
  // ```
  //
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

  //
  // ### stop
  //
  // Stops the frame
  //
  // ```
  // @cb_    {functio(err)}
  // ```
  //
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


  //
  // ### init
  //
  // Runs initialization procedure.
  //
  init = function() {
    _breach._createExoFrame({
      name: my.name,
      url: my.url
    }, function(f) {
      my.internal = f;

      my.internal._setTitleUpdatedCallback(function(title) {
        my.title = title;
        if(my.parent) {
          my.parent.emit('frame_title_updated', that, title);
        }
      });

      my.ready = true;
      that.emit('ready');
    });
  };


  init();

  common.method(that, 'pre', pre, _super);
  common.method(that, 'load_url', load_url, _super);
  common.method(that, 'go_back_or_forward', go_back_or_forward, _super);
  common.method(that, 'reload', reload, _super);
  common.method(that, 'stop', stop, _super);

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
  common.setter(that, 'loading', my, 'loading');
  common.setter(that, 'title', my, 'title');

  common.method(that, 'pre', pre, _super);

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


//
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
//
// ```
// @spec { size, [name] }
// ```
//
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

  //
  // ### pre
  //
  // Takes care of the syncronization. If the browser is not yet ready it will
  // wait on the `ready` event. If the browser is killed it will return an error
  //
  // ```
  // @cb_ {function(err)}
  // ```
  //
  pre = function(cb_) {
    if(my.killed)
      return cb_(new Error('Browser has already been killed'));
    else if(!my.ready) {
      that.on('ready', function() {
        return cb_();
      });
    }
    else {
      return cb_();
    }
  };

  //
  // ### set_control
  //
  // Adds the specified as a control for the given type
  //
  // ```
  // @type  {control_type} the type (see exports constants)
  // @frame {exo_frame} the frame to set as control
  // @cb_   {function(err)} [optional]
  // ```
  //
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
          if(cb_) return cb_();
        });
      }
    });
  };

  //
  // ### unset_control
  //
  // Unsets the control specified by type (returns its frame if it was set)
  //
  // ```
  // @type  {control_type} the type (see exports constants)
  // @cb_   {function(err, frame)} [optional]
  // ```
  //
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
          my.controls[type] = null;
          my.control_dimensions[type] = 0;
          delete my.frames[control.name()];
          if(cb_) return cb_(null, control);
        });
      }
    });
  };

  //
  // ### set_control_dimension
  //
  // Sets the given size as pixels as canonical dimension for the control
  //
  // ```
  // @type  {Number} the type (see exports contants)
  // @size  {Number} the size in pixels
  // @cb_   {function(err, frame)} [optional]
  // ```
  //
  set_control_dimension = function(type, size, cb_) {
    pre(function(err) {
      if(err) {
        if(cb_) return cb_(err);
      }
      else {
        my.internal._setControlDimension(type, size, function() {
          my.control_dimensions[type] = size;
          if(cb_) return cb_(null, my.controls[type]);
        });
      }
    });
  };

  //
  // ### add_page
  //
  // Adds a page to the browser. The visible page is not altered by this method
  //
  // ```
  // @frame {exo_frame} the frame to add as a page
  // @cb_   {funciton(err)
  // ```
  //
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

  //
  // ### remove_page
  //
  // Removes the specified page
  //
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
        my.internal._removePagE(frame.name(), function() {
          frame.set_parent(null);
          frame.set_type(exports.NO_TYPE);
          delete my.pages[frame.name()];
          delete my.frames[frame.name()];
          if(cb_) return cb_();
        });
      }
    });
  };

  //
  // ### show_page
  //
  // Shows the provided page in the browser.
  // 
  // ```
  // @frame {exo_frame} the frame to add as a page
  // @cb_   {funciton(err)
  // ```
  //
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
          /* TODO(spolu): update frame state */
          if(cb_) return cb_();
        });
      }
    });
  };


  //
  // ### kill
  //
  // Kills the browser, removes it from the internal registry and deletes its
  // internal representation so that the native objects get deleted.
  // 
  // ```
  // @cb_ {function(err)} [optional]
  // ```
  //
  kill = function(cb_) {
    pre(function(err) {
      if(err) {
        if(cb_) return cb_(err);
      }
      else {
        /* The `Kill` Callback is going to be called so we should not do  */
        /* anything here, esp. as `KIll` can be called internally (window */
        /* closed).                                                       */
        my.internal.Kill(function() {
          if(cb_) return cb_();
        });
      }
    });
  };

  //
  // ### init
  //
  // Runs initialization procedure and adds itself to the internal registry.
  //
  init = function() {
    _breach._createExoBrowser({
      size: my.size
    }, function(b) {
      my.internal = b;
      exports._exo_browsers[my.name] = that;

      my.internal._setOpenURLCallback(function(url, from) {
        var origin = my.frames[from] || null;
        that.emit('open_url', url, origin);
      });
      my.internal._setResizeCallback(function(size) {
        my.size = size;
        that.emit('resize', size);
      });
      my.internal._setKillCallback(function() {
        /* `Kill` has been called from here or somewhere else so let's make */
        /* sure we have eveything cleaned up */
        delete my.internal;
        my.killed = true;
        my.ready = false;
        delete exports._exo_browsers[my.name];
      });
      my.internal._setFrameLoadingStateChangeCallback(function(from, loading) {
        if(my.frames[from]) {
          my.frames[from].set_loading(loading);
          that.emit('frame_loading_state_change', my.frames[from], loading);
        }
      });
      my.internal._setFrameCloseCallback(function(from) {
        factory.log().out('frame_close: ' + from);
        if(my.frames[from]) {
          /* TODO(spolu): figure out if this event is useful */
        }
      });
      my.internal._setFrameNavigateCallback(function(from, url) {
        if(my.frames[from]) {
          my.frames[from].set_url(url);
          that.emit('frame_navigate', my.frames[from], url);
        }
      });
      my.internal._setFrameCreatedCallback(function(frame) {
        that.emit('frame_created', frame);
      });
      my.internal._setFrameKeyboardCallback(function(from, event) {
        that.emit('frame_keyboard', my.frames[from], event);
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

  common.method(that, 'set_control', set_control, _super);
  common.method(that, 'unset_control', unset_control, _super);
  common.method(that, 'set_control_dimension', set_control_dimension, _super);

  common.method(that, 'add_page', add_page, _super);
  common.method(that, 'remove_page', remove_page, _super);
  common.method(that, 'show_page', show_page, _super);

  common.method(that, 'kill', kill, _super);

  return that;
};

exports.exo_browser = exo_browser;

