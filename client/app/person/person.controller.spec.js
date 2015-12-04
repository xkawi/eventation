'use strict';

describe('Controller: PersonCtrl', function () {

  // load the controller's module
  beforeEach(module('eventationApp'));

  var PersonCtrl, scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    PersonCtrl = $controller('PersonCtrl', {
      $scope: scope
    });
  }));

  it('should ...', function () {
    expect(1).toEqual(1);
  });
});
