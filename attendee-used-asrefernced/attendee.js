'use strict';

angular.module('eventationApp')
  .config(function ($stateProvider) {
    $stateProvider
      // .state('attendee', {
      //   url: '/attendee',
      //   templateUrl: 'app/attendee/attendee.html',
      //   controller: 'AttendeeCtrl'
      // })
      .state('attendee', {
        url: '/:eventid/attendee',
        templateUrl: 'app/attendee/attendee.html',
        controller: 'AttendeeCtrl'
      })
       ;
  });