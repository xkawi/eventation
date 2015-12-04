'use strict';

angular.module('eventationApp')
.controller('EventCtrl', function ($scope, $http, $state, FileUploader, socket, $location, ngToast, $cachedResource, Auth) {
    $scope.message = 'Hello';
    $scope.istoggled = false;

    $scope.isAdmin = Auth.isAdmin;

    Auth.isLoggedInAsync(function(loggedin){
        if (loggedin) {
            var currentUserId = $scope.userId = Auth.getCurrentUser()._id;
            //console.log(currentUserId);

            var query = !$scope.isAdmin() ? '/?userId='+currentUserId : '';
            $http.get('/api/events' + query).success(function(events) {
                $scope.events = events;
                socket.syncUpdates('event', $scope.events);
            });

            if ($scope.isAdmin()) {
                $http.get('/api/users').success(function(users) {
                    $scope.users = users;
                });

                $scope.assignUser = function(event){
                    console.log('event assigned to user:', event);
                    $http.put('/api/events/'+event._id, event).success(function(updated){
                        //console.log('updated event', updated);
                        ngToast.create('Role assigned successfully');
                    }).error(function(err){
                        ngToast.create('Role assignment failed. please try again later');
                        //console.log('update event error', error);
                    });
                };
            }

        }
    });
    // Define a resource
    // var Events = $cachedResource('events', '/api/events/:id/:controller', {id: '@_id', controller:'@controller'}, {
    //     delete: { method: 'DELETE' }
    // });
    
    // var allEvents =  Events.query();
    // allEvents.$httpPromise.then(function(){
    //     console.log('allEvents:', allEvents);
    //     $scope.events = allEvents;
    //     socket.syncUpdates('event', $scope.events);
    // });
    
    
    $scope.onConnect = function(){
        console.log('onConnect goes online');
        
        if ($scope.offline) {
            //so we know when it goes online from offline
            $scope.offline = false;
        }
        //when it goes back online: reload the page to allow the angular-cached-resource update the local copy
        //also clear the temporary variable used when offline
        //clear the cache too?
        
    };

    $scope.onDisconnect = function(){
        //temporarily use different data source only to update the view
        //preferably not angular-cached-resource
        console.log('onDisconnect goes offline');
        // $scope.backup = angular.copy($scope.events);
        // console.log($scope.backup);
        $scope.offline = true;
        // socket.unsyncUpdates('event');
        // $scope.events 
    };

    // function pullEventsFromServer(){
    //     var allEvents =  Events.query();
    //     allEvents.$promise.then(function(){
    //         console.log('allEvents:', allEvents);
    //         $scope.events = allEvents;
    //         socket.syncUpdates('event', $scope.events);
    //     });
    // }
    

    

    $scope.$on('$destroy', function () {
        socket.unsyncUpdates('event');
    });

    $scope.createEvent = function(form) {
        $scope.submitted = true;
        if (form.$valid) {
            $scope.event.staff = $scope.userId;
            // var newEvent = new Events();
            // newEvent.name = $scope.event.name;
            // newEvent.$save(function(){
            //     console.log('new event created', newEvent); 
            //     // ngToast.create(newEvent.name + ' Created Successfully');
            // });
            //console.log('createEvent:', $scope.event);
            if ($scope.offline) {
                $scope.events.push($scope.event);          
            } else {
                $http.post('/api/events', $scope.event).success(function(newevent){
                    ngToast.create(newevent.name + ' Created Successfully');            
                });                
            }

            $scope.event = {};
            $scope.submitted = false;
        }
    };

    $scope.deleteEvent = function($index, e) {
        if ($scope.offline) {
            $scope.events.splice($index, 1);
        } else {
            $http.delete('/api/events/'+e._id).success(function(deletedEvent){
                //console.log('deletedEvent:', deletedEvent);
            });   
       }

        // var toDeleteEvent = Events.delete({_id: e._id});
        // toDeleteEvent.$promise.then(function(){
        //     console.log('event got deleted', toDeleteEvent);                  
        // });

        ngToast.create(e.name + ' Deleted Successfully');
    };

});
