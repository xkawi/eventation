'use strict';

describe('Directive: connectivity', function () {

  // load the directive's module
  beforeEach(module('eventationApp'));

  var element,
    scope;

  beforeEach(inject(function ($rootScope) {
    scope = $rootScope.$new();
  }));

  it('should make hidden element visible', inject(function ($compile) {
    element = angular.element('<connectivity></connectivity>');
    element = $compile(element)(scope);
    expect(element.text()).toBe('this is the connectivity directive');
  }));
});