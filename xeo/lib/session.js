/*
 * Breach: session.js
 *
 * (c) Copyright Stanislas Polu 2013. All rights reserved.
 *
 * @author: spolu
 *
 * @log:
 * 2013-08-12 spolu   Creation
 */

var common = require('./common.js');
var factory = common.factory;
var api = require('./api.js');
var async = require('async');


// ## session
//
// ```
// @spec { base_url }
// ```
var session = function(spec, my) {
  var _super = {};
  my = my || {};
  spec = spec || {};

  my.base_url = spec.base_url;
  my.name = 'no_session';
  my.exo_browser = null;

  my.loading_frame = null;

  my.stack = null;
  my.box = null;
  my.keyboard_shortcuts = null;

  //
  // #### _public_
  //
  var handshake;   /* handshake(name, socket); */
  var kill;        /* kill(); */

  //
  // #### _private_
  //
  var init;          /* init(); */

  var browser_frame_created; /* frame_created(frame, disp, origin); */
  var browser_open_url;      /* open_url(url, disp, origin); */

  //
  // #### _that_
  //
  var that = {};


  // ### init
  // 
  // Initialializes this session and spawns the associated exo_browser
  init = function() {
    my.exo_browser = api.exo_browser({
      size: [1200, 768]
    });
    my.name = my.exo_browser.name();

    my.keyboard_shortcuts = 
      require('./keyboard_shortcuts.js').keyboard_shortcuts({
      session: that
    });

    my.exo_browser.on('frame_created', browser_frame_created);
    my.exo_browser.on('open_url', browser_open_url);

    my.loading_frame = api.exo_frame({
      name: my.name + '_loading',
      url: my.base_url + '/loading.html'
    });
    my.exo_browser.add_page(my.loading_frame, function() {
      my.exo_browser.show_page(my.loading_frame);
    });

    my.stack = require('./stack.js').stack({
      session: that
    });
    my.box = require('./box.js').box({
      session: that
    });

    async.parallel({
      stack: function(cb_) {
        my.stack.init(cb_);
      },
      box: function(cb_) {
        my.box.init(cb_);
      },
    }, function(err) {
      my.stack.show();
      my.box.show();

      my.exo_browser.focus(function() {
        my.box.focus();
      });
    });
  };

  /****************************************************************************/
  /*                            EXOBROWSER EVENTS                             */
  /****************************************************************************/
  // ### browser_frame_created
  //
  // Event received when a new frame has been created (generally a popup).
  // Depending on the disposition, we'll ignore it (handled by the stack) or 
  // we'll create a new exo_browser to handle the detached popup
  // ```
  // @frame       {exo_frame} the newly created frame
  // @disposition {string} the disposition for opening that frame
  // @origin      {exo_frame} origin exo_frame
  // ```
  browser_frame_created = function(frame, disposition, from) {
    if(disposition === 'new_window') {
      /* TODO(spolu): Handle new window. */
    }
    if(disposition === 'new_popup') {
      /* TODO(spolu): Handle new popup. */
    }
    /*TODO(spolu): Handle other dispsition not handled by the stack. */
  };

  // ### browser_open_url
  //
  // Event received when a new URL should be opened by the session. Depending on
  // the disposition we'll ignore it (handled by the stack) or we'll create a
  // new exo_browser to handle the detached popup
  // ```
  // @url         {string} the URL to open
  // @disposition {string} the disposition for opening that frame
  // @origin      {exo_frame} origin exo_frame
  // ```
  browser_open_url = function(url, disposition, origin) {
    if(disposition === 'new_window') {
      /* TODO(spolu): Handle new window. */
    }
    if(disposition === 'new_popup') {
      /* TODO(spolu): Handle new Popup. */
    }
    /*TODO(spolu): Handle other dispsition not handled by the stack. */
  };

  /****************************************************************************/
  /*                              PUBLIC METHODS                              */
  /****************************************************************************/
  // ### handshake
  //
  // Receives the socket io socket associated with one of this session's frame.
  // (stack, home, ...)
  // ```
  // @name   {string} the name of the frame
  // @socket {socket.io socket}
  // ```
  handshake = function(name, socket) {
    var name_r = /^(br-[0-9]+)_(stack|box)$/;
    var name_m = name_r.exec(name);
    if(name_m) {
      if(name_m[2] === 'stack')
        my.stack.handshake(socket);
      if(name_m[2] === 'box')
        my.box.handshake(socket);
    }
  };

  // ### kill
  //
  // Kills this session as well as the underlying exo_browser
  kill = function() {
    my.exo_browser.kill();
  };

  
  common.method(that, 'handshake', handshake, _super);
  common.method(that, 'kill', kill, _super);

  common.getter(that, 'name', my, 'name');
  common.getter(that, 'exo_browser', my, 'exo_browser');
  common.getter(that, 'base_url', my, 'base_url');

  common.getter(that, 'stack', my, 'stack');
  common.getter(that, 'box', my, 'box');
  common.getter(that, 'keyboard_shortcuts', my, 'keyboard_shortcuts');

  common.getter(that, 'base_url', my, 'base_url');

  init();

  return that;
};

exports.session = session;
