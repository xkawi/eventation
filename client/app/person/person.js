'use strict';

angular.module('eventationApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('person', {
        url: '/:eventid/person',
        templateUrl: 'app/person/person.html',
        controller: 'PersonCtrl'
      });
  });