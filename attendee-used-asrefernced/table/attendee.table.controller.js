'use strict';

angular.module('eventationApp')
.controller('AttendeeTableCtrl', function ($scope, $http, $state, socket, FileUploader, $stateParams, $filter, ngToast, $resource) {

	var Event = $resource('event', '/api/events/:id/:controller', {id: '@_id', controller:'@controller'}, {
		getKeys: {
			method: 'GET', params: {id: '@_id', controller: 'keys'}
		}
	});
  var Attendees = $resource('attendees', '/api/attendees/:id/:controller', {id: '@_id', controller:'@controller'}, {
  	checkin: { method: 'PUT' },
  	delete: { method: 'DELETE' }
  });

	var eventid = $scope.eventid = $stateParams.eventid;
	$scope.searchTerm = {};

	$scope.showCheckin = false;
	
	// $localForage.getItem('autoCheckinMode').then(function(data) {
	// 	$scope.checkinMode = data;
	// });

	$scope.changeMode = function(mode){
		console.log('changeMode', mode);
		// $localForage.setItem('autoCheckinMode',mode);
	};

	var selectedEvent = Event.get({id: eventid});
	selectedEvent.$promise.then(function(){
		console.log('selectedEvent:', selectedEvent);
		$scope.selectedEvent = selectedEvent;
	});
	// $http.get('/api/events/'+eventid).success(function(event) {
	// 	$scope.selectedEvent = event;
	// });
	
	$scope.onConnect = function(){
		console.log('onConnect: offline = ', $scope.offline);

		if ($scope.offline) {
			$scope.offline = false;
			console.log('length of Events.write', Attendees.$writes);
			var results = Attendees.$writes.flush();
			console.log('result after flush', results);
		}
	};

	$scope.onDisconnect = function(){
		$scope.offline = true;
	};

	var retrieveAttendeeDetail = function(eventid){

		// var attendees = Attendees.query({eid: eventid});
		// attendees.$promise.then(function(){
		// 	console.log('attendees in retrieveAttendeeDetail:', attendees);

		// 	$scope.attendees = attendees;

		// 	$scope.renderdAttendees = _.map(attendees, function(att){ return att.detail });    
		// 	console.log($scope.renderdAttendees);

		// 	var numOfCheckedInAttendees = function(){
		// 		var attendees = _.filter($scope.attendees, function(att) { return att.present; });
		// 		return attendees.length;
		// 	};

		// 	var numOfNonCheckedInAttendees = function(){
		// 		var attendees = _.filter($scope.attendees, function(att) { return !att.present; });
		// 		return attendees.length;
		// 	};

		// 	var colorArray = ['#33ff00', '#ff0000'];
		// 	$scope.colorFunction = function() {
		// 		return function(d, i) {
		// 			return colorArray[i];
		// 		};
		// 	};

		// 	$scope.exampleData = [
		// 	{ key: 'Checked In', y: numOfCheckedInAttendees() },
		// 	{ key: 'Not Checked In', y: numOfNonCheckedInAttendees() }
		// 	];

		// 	$scope.xFunction = function(){
		// 		return function(d) {
		// 			return d.key;
		// 		};
		// 	};
		// 	$scope.yFunction = function(){
		// 		return function(d){
		// 			return d.y;
		// 		};
		// 	};

		// 	socket.syncUpdates('attendee', $scope.attendees, function(e, item){
		// 		if ($scope.selectedAttendee && $scope.selectedAttendee._id === item._id) {
		// 			$scope.selectedAttendee = item;
		// 		}
		// 	});

		// });
		$http({
			url: '/api/attendees', 
			method: 'GET',
			params: {'eid' : eventid }
		}).success(function(attendees) {
			$scope.attendees = attendees;

			var numOfCheckedInAttendees = function(){
				var attendees = _.filter($scope.attendees, function(att) { return att.present; });
				return attendees.length;
			};

			var numOfNonCheckedInAttendees = function(){
				var attendees = _.filter($scope.attendees, function(att) { return !att.present; });
				return attendees.length;
			};

			socket.syncUpdates('attendee', $scope.attendees, function(e, item, array){
				if ($scope.selectedAttendee && $scope.selectedAttendee._id === item._id) {
					$scope.selectedAttendee = item;
				}
			});
		});
	};

	var retrieveAllKeys = function(eventid){
		
		// var eventKeys = Event.getKeys({id: eventid});
		// eventKeys.$promise.then(function(){
		// 	console.log('eventKeys:', eventKeys);
		// 	$scope.keys = eventKeys.keys;
		// });
		$http.get('/api/events/'+eventid+'/keys').success(function(keys) {
			$scope.keys = keys;
			console.log('keys', keys);
		});
	};



	var searching = $scope.searching = function(searchTerm){
		console.log(searchTerm);
		var notCheckInYet = $filter('filter')($scope.attendees,{present: false});		
		var filteredAttendees = $filter('universalFilter')(notCheckInYet,searchTerm);
		console.log('filteredAttendees.length', filteredAttendees.length);
		if (filteredAttendees.length === 1 && $scope.checkinMode === true) {			
			var att = filteredAttendees[0];
			if (!att.present) {
				$scope.checkinAttendee(null, filteredAttendees[0]);
			}
		}
	};

	$scope.chooseKey = function($index, key){
		$scope.selectedKey = key;
		$scope.searchTerm.criteria = key;
		searching($scope.searchTerm);
	};

	retrieveAllKeys($scope.eventid);

	retrieveAttendeeDetail(eventid);

	$scope.$on('$destroy', function () {
		socket.unsyncUpdates('attendee');
	});

	var uploader = $scope.uploader = new FileUploader({
		url: '/api/events/upload'
	});

	uploader.filters.push({
		name: 'csvFilter',
		fn: function(item /*{File|FileLikeObject}*/, options) {
			var type = '|' + item.type.slice(item.type.lastIndexOf('/') + 1) + '|';
			return '|csv|'.indexOf(type) !== -1;
		}
	});

	uploader.onWhenAddingFileFailed = function(item /*{File|FileLikeObject}*/, filter, options) {
		console.info('onWhenAddingFileFailed', item, filter, options);
	};
	uploader.onAfterAddingFile = function(fileItem) {
		console.info('onAfterAddingFile', fileItem, 'upload directly');
		fileItem.upload();
	};
	uploader.onAfterAddingAll = function(addedFileItems) {
		console.info('onAfterAddingAll', addedFileItems);
	};
	uploader.onBeforeUploadItem = function(item) {
		console.info('onBeforeUploadItem', item);
	};
	uploader.onProgressItem = function(fileItem, progress) {
		console.info('onProgressItem', fileItem, progress);
	};
	uploader.onProgressAll = function(progress) {
		console.info('onProgressAll', progress);
	};
	uploader.onSuccessItem = function(fileItem, response, status, headers) {
		console.info('onSuccessItem', fileItem, response, status, headers);
	};
	uploader.onErrorItem = function(fileItem, response, status, headers) {
		console.info('onErrorItem', fileItem, response, status, headers);
	};
	uploader.onCancelItem = function(fileItem, response, status, headers) {
		console.info('onCancelItem', fileItem, response, status, headers);
	};
	uploader.onCompleteItem = function(fileItem, response, status, headers) {
		console.info('onCompleteItem', fileItem, response, status, headers);
	};
	uploader.onCompleteAll = function() {
		console.info('onCompleteAll');
		retrieveAttendeeDetail($scope.selectedEvent._id);
		uploader.clearQueue();
	};

	$scope.addAttendee = function() {
		if($scope.attendee.name === '') {
			return;
		}

		var attendee = new Attendees();
		attendee.name = $scope.attendee.name;
		attendee.$save(function(){
			console.log('new attendee added:', attendee);
			$scope.attendee = {};
		});
		// $http.post('/api/attendees', $scope.attendee );
		// $scope.attendee = {};
	};

	$scope.selectAttendee = function($index, att){
		$scope.selectedAttendee = $scope.attendees[$index];
	};

	$scope.deleteAttendee = function($index, att) {

		if ($scope.offline) {
			$scope.attendees.splice($index, 1);
			console.log('deleted locally', $index, att);
		}

		var attendee = Attendees.delete({_id: att._id});
		// attendee.id = att._id;
		attendee.$promise.then(function(){
			console.log('deleted remotely', attendee);
			// $scope.attendees.splice($index, 1);
			ngToast.create('Attendee Deleted Successfully');			
		});
		// $http.delete('/api/attendees/' + att._id).success(function(){
		// 	ngToast.create('Attendee Deleted Successfully');
		// });
	};

	$scope.checkinAttendee = function($index, att){

		if ($scope.offline) {
			if ($index) {
				$scope.attendees[$index].present = true;
				console.log(att, 'present set to true locally');
			}
		}
		// var attendee = Attendees.update({id: att._id});
		var updatedAttendee = Attendees.checkin({id: att._id}, {present:true});
		updatedAttendee.$promise.then(function(){
			console.log('attendee successfully checkin', updatedAttendee);
			$scope.selectedAttendee = updatedAttendee;
			if ($scope.checkinMode === true && $scope.searchTerm.text && $scope.searchTerm.criteria) {
				ngToast.create(att.detail[$scope.searchTerm.criteria] + ' Check In Success');
			} else {
				ngToast.create('Attendee Check In Success');				
			}
		});
		// $http.put('/api/attendees/'+att._id, {present: true}).success(function(success){
		// 	$scope.selectedAttendee = success;
		// 	if ($scope.checkinMode === true && $scope.searchTerm.text && $scope.searchTerm.criteria) {
		// 		ngToast.create(att.detail[$scope.searchTerm.criteria] + ' Check In Success');
		// 	} else {
		// 		ngToast.create('Attendee Check In Success');				
		// 	}
		// });
	};

	$scope.undoCheckin = function($index, att){
		if ($scope.offline) {
			$scope.attendees[$index].present = false;
			console.log(att, 'present set to false locally');			
		}
		var updatedAttendee = Attendees.checkin({id: att._id}, {present:false});
		updatedAttendee.$promise.then(function(){
			console.log('attendee successfully checkin', updatedAttendee);
			$scope.selectedAttendee = updatedAttendee;
			ngToast.create('Attendee Checked In Successfully Undo');
		});
		// $http.put('/api/attendees/'+att._id, {present: false}).success(function(success){
		// 	$scope.selectedAttendee = success;
		// 	ngToast.create('Attendee Checked In Successfully Undo');
		// });
	};


});
