'use strict';

describe('Controller: AttendeeCtrl', function () {

  // load the controller's module
  beforeEach(module('eventationApp'));

  var AttendeeCtrl, scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    AttendeeCtrl = $controller('AttendeeCtrl', {
      $scope: scope
    });
  }));

  it('should ...', function () {
    expect(1).toEqual(1);
  });
});
