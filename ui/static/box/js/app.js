/*
 * Breach: app.js [box]
 *
 * (c) Copyright Stanislas Polu 2013. All rights reserved.
 *
 * @author: spolu
 *
 * @log:
 * 2013-08-16 spolu  Creation
 */

'use strict';

//
// ## App Module
//
angular.module('breach', ['breach.services', 
                          'breach.directives', 
                          'breach.filters']);

//
// ###  BoxTopCtrl
// Initializations goes here as well as global objects
//
function BoxTopCtrl($scope, $location, $rootScope, $window, $timeout,
                    _session, _socket) {

  /* Handhsaking */
  _socket.emit('handshake', _session.name() + '_box');

  _socket.on('active_url', function(active_url) {
    console.log('RECEIVED ACTIVE_URL: ' + active_url);
    $scope.active_url = active_url;
  });
}

angular.module('breach.directives', []);
angular.module('breach.filters', []);
angular.module('breach.services', []);

