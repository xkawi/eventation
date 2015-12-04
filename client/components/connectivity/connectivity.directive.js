'use strict';

angular.module('eventationApp')
.directive('connectivity', function ($window, $parse) {
	return {
		restrict: 'A',
		link: function($scope, element, $attrs) {
			var events = $scope.$eval($attrs.connectivity);
			angular.forEach(events, function(connEvent, eventName) {
				var fn;
				fn = $parse(connEvent);
				switch (eventName) {
					case 'connect':
					$scope.connect = fn;
					return $window.addEventListener('online', function() {
						console.log('Detect Online Event');
						return $scope.$apply(function() {
							return fn($scope);
						});
					});
					case 'disconnect':
					$scope.disconnect = fn;
					return $window.addEventListener('offline', function() {
						console.log('Detect Offline Event');
						return $scope.$apply(function() {
							return fn($scope);
						});
					});
				}
			});
			if (navigator.onLine) {
				return $scope.connect($scope);
			} else {
				return $scope.disconnect($scope);
			}
		}
	};
});




