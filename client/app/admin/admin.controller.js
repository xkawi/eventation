'use strict';

angular.module('eventationApp')
  .controller('AdminCtrl', function ($scope, $http, Auth, User, ngToast) {

    // Use the User $resource to fetch all users
    $scope.users = User.query();
    $scope.roles = ['admin', 'user'];
    $scope.updating = [];
    
    $scope.changeRole = function(user, $index) {
      $scope.updating[$index] = true;

      $scope.selectedUser = angular.copy(user);
      $scope.selectedRole = angular.copy(user.role);

      User.updateProfile({
        id: $scope.selectedUser._id
      }, $scope.selectedUser, function() {
        $scope.updating[$index] = false;
        ngToast.create('Role assigned successfully');
      }, function() {
        ngToast.create({
          class: 'danger',
          content: 'Role assignment failed. Try again later.'
        });
      });
    };
        
    $scope.delete = function(user) {
      User.remove({ id: user._id });
      angular.forEach($scope.users, function(u, i) {
        if (u === user) {
          $scope.users.splice(i, 1);
        }
      });
    };
  });
