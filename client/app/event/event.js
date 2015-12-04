'use strict';

angular.module('eventationApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('event', {
        url: '/',
        templateUrl: 'app/event/event.html',
        controller: 'EventCtrl',
        authenticate: true
      });
      // .state('event.attendee', {
      // 	url: '/:eventid',
      // 	templateUrl: 'app/attendee/attendee.html',
      // 	controller: 'AttendeeCtrl'
      // });
  });