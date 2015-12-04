'use strict';

angular.module('eventationApp', [
  'ngCookies',
  'ngResource',
  'ngSanitize',
  'ngAnimate',
  'btford.socket-io',
  'ui.router',
  'ui.bootstrap',
  'angularFileUpload',
  'ngCachedResource',
  'toggle-switch',
  'nvd3ChartDirectives',
  'ngToast',
  'xeditable',
  'LocalForageModule'
])
.run(function(editableOptions) {
  editableOptions.theme = 'bs3'; // bootstrap3 theme. Can be also 'bs2', 'default'
})
  .config(function ($stateProvider, $urlRouterProvider, $locationProvider, $httpProvider, ngToastProvider) {
    $urlRouterProvider
      .otherwise('/');

    $locationProvider.html5Mode(true);
    $httpProvider.interceptors.push('authInterceptor');

    ngToastProvider.configure({
        horizontalPosition: 'center',
        verticalPosition: 'top'
    });

  })
  .config(function($tooltipProvider) {
    $tooltipProvider.options({animation: false});
  })
  .factory('authInterceptor', function ($rootScope, $q, $cookieStore, $location) {
    return {
      // Add authorization token to headers
      request: function (config) {
        config.headers = config.headers || {};
        if ($cookieStore.get('token')) {
          config.headers.Authorization = 'Bearer ' + $cookieStore.get('token');
        }
        return config;
      },

      // Intercept 401s and redirect you to login
      responseError: function(response) {
        if(response.status === 401) {
          $location.path('/login');
          // remove any stale tokens
          $cookieStore.remove('token');
          return $q.reject(response);
        }
        else {
          return $q.reject(response);
        }
      }
    };
  })

  .run(function ($rootScope, $location, Auth) {
    // Redirect to login if route requires auth and you're not logged in
    $rootScope.$on('$stateChangeStart', function (event, next) {
      Auth.isLoggedInAsync(function(loggedIn) {
        if (next.authenticate && !loggedIn) {
          $location.path('/login');
        }

        // if ($location.path() === '/' && loggedIn) {
        //     $location.path('/event');
        // }

        // console.log(loggedIn);

      });
    });
  });