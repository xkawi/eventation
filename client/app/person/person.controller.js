'use strict';

angular.module('eventationApp')
.filter('universalFilter', function() {
	return function(attendees, searchTerm) {
		if (searchTerm && searchTerm.text && searchTerm.criteria) {
			var result = [];
			angular.forEach(attendees, function(attendee) {
				if (attendee.details[searchTerm.criteria]) {
					var value = attendee.details[searchTerm.criteria];
					var source = typeof(value) !== 'string' ? value.toString().toLowerCase() : value.toLowerCase();
					if (typeof(value) === 'number') {
						if (source === searchTerm.text.toLowerCase()) {
							result.push(attendee);
						}
					} else {
						if (source.indexOf(searchTerm.text.toLowerCase()) > -1) {
							result.push(attendee);
						}						
					}
				}
			});
			return result;
		} else {
			return attendees;
		}
	};
})
.controller('PersonCtrl', function ($scope, $http, $modal, $state, socket, FileUploader, $stateParams, $filter, ngToast, $cachedResource, $localForage) {

	// $cachedResource.clearCache();

	var eventid = $scope.eventid = $stateParams.eventid;
	var localCheckinCacheKeyName = eventid +'LocalCheckin';
		
	$scope.searchTerm = {};
	$scope.showCheckin = false;
	
	$scope.changeMode = function(mode){
		
		$localForage.setItem('autoCheckinMode',mode);
	};

	$http.get('/api/events/'+eventid).success(function(ev){
		$scope.event = ev;
	});
	
	$http.get('/api/attendees'+'?eid='+eventid).success(function(attendees){
		var parsedDetails = _.map(attendees, detailsStrToObj);
		$scope.attendees = parsedDetails;
		$scope.masterCopy = angular.copy($scope.attendees);
			
		$scope.fields = attendees.length > 0 ? attendees[0].fields : [];

		$scope.maxSize = 5;
		$scope.currentPage = 1;
		$scope.recordPerPage = 10;
		$scope.numOfLimitRecord = $scope.currentPage * $scope.recordPerPage;

		$scope.$watch('currentPage + recordPerPage', function() {
			var begin = (($scope.currentPage-1) * $scope.recordPerPage);
			var end = begin + $scope.recordPerPage;

			// var notCheckInYet = $filter('filter')($scope.attendees,{present: $scope.showCheckin});		
			// var filteredAttendees = $filter('universalFilter')($scope.attendees,$scope.searchTerm);
	
			$scope.filteredAttendees = $scope.attendees.slice(begin, end);
		});

		socket.syncUpdates('attendee', $scope.attendees, function(e, item){
			if (typeof(item.details)==='string') {
				item.details = JSON.parse(item.details);
			}
			
			// var parsedItem = detailsStrToObj(item);
			// if ($scope.selectedAttendee && $scope.selectedAttendee._id === item._id) {
			// 	$scope.selectedAttendee = item;
			// }
		});
	});
	$scope.$on('$destroy', function () {
		socket.unsyncUpdates('attendee');
	});

	var searching = $scope.searching = function(searchTerm){
		
		var notCheckInYet = $filter('filter')($scope.attendees,{present: false});		
		var filteredAttendees = $filter('universalFilter')(notCheckInYet,searchTerm);
		
		if (filteredAttendees.length === 1 && $scope.checkinMode === true) {			
			var att = filteredAttendees[0];
			if (!att.present) {
				$scope.checkinAttendee(null, filteredAttendees[0]);
				// $scope.searchTerm.text = '';
			}
		}
	};

	$scope.chooseField = function($index, field){
		$scope.selectedField = field;
		$scope.searchTerm.criteria = field;
		searching($scope.searchTerm);
	};

	$scope.editAttendee = function($index, att){
		var editAttendeeModal = $modal.open({
			templateUrl: 'attendeeDetailModal.html',
			controller: 'AttendeeDetailCtrl',
			resolve: {
				attDetails: function () {
					return att.details;
				}
			}
		});
		editAttendeeModal.result.then(function (newDetail) {
			$http.put('/api/attendees/'+att._id, {details: newDetail}).success(function(updated){
				ngToast.create('Updating attendee success');
				// att.details = newDetail;
				
				// $scope.attendees.splice($index, 1, detailsStrToObj(updated));
			}).error(function(err){
				ngToast.create({class:'danger', content:'Editing attendee failed. Try again later.'});				
				
			});
		}, function () {
			console.log('Modal dismissed at: ' + new Date());
		});
	};

	$scope.addAttendee = function(){
		var addAttendeeModal = $modal.open({
			templateUrl: 'addAttendeeModal.html',
			controller: 'AddAttendeeCtrl',
			resolve: {
				fields: function () {
					return $scope.fields;
				}
			}
		});
		addAttendeeModal.result.then(function (newDetail) {			
			var newAtt = {present: false, event: $scope.eventid, details: newDetail, fields: $scope.fields };
			$http.post('/api/attendees', newAtt).success(function(){      		
				// $scope.attendees.splice(0, 1, detailsStrToObj(newAttData));
				ngToast.create('New attendee added successfully');
			}).error(function(err){
				ngToast.create({class:'danger', content:'Adding new attendee failed. Try again later.'});				
				
			});
		}, function () {
			console.log('Modal dismissed at: ' + new Date());
		});
	};

	$scope.checkinAttendee = function($index, att){
		// if (!$index) { att.present = true; }
		$http.put('/api/attendees/'+att._id, {present: true}).success(function(attendeeData){
			// var obj = detailsStrToObj(attendeeData);
			// if ($index) {
			// 	$scope.attendees[$index] = obj;
			// }
			ngToast.create('Attendee Check In Success');
			updateLocalCheckInCounter(attendeeData._id);							
		}).error(function(err){
			ngToast.create({class:'danger', content:'Attendee Check In Error'});
			// console.log('attendee check in error', err);
		});
	};

	$scope.undoCheckin = function($index, att){
		$http.put('/api/attendees/'+att._id, {present: false}).success(function(attendeeData){
			// $scope.attendees[$index] = detailsStrToObj(attendeeData);
			ngToast.create('Undo Check In Success');
			undoLocalCheckInCounter(attendeeData._id);
		}).error(function(err){
			ngToast.create('Undo Check In Failed');
			// console.log('attendee check in error', err);
		});
	};

	var uploader = $scope.uploader = new FileUploader({
		url: '/api/events/upload'
	});

	uploader.onWhenAddingFileFailed = function(item /*{File|FileLikeObject}*/, filter, options) {
		console.info('onWhenAddingFileFailed', item, filter, options);
		ngToast.create({class:'danger', content:'adding file failed, check console.'});
	};
	uploader.onAfterAddingFile = function(fileItem) {
		console.info('onAfterAddingFile', fileItem, 'upload directly');
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
		uploader.clearQueue();
		$state.reload();
	};

	var detailsStrToObj = function(att){ 
		if (typeof(att.details) === 'string') {
			att.details = JSON.parse(att.details);
		}
		return att;
	};

	var updateLocalCheckInCounter = function(attId){
		
		$localForage.getItem(localCheckinCacheKeyName).then(function(data) {
			// console.log('eventationCheckin data:', data);					
			if (!data) {
				var arr = []; arr.push(attId);
				$localForage.setItem(localCheckinCacheKeyName, arr);
			} else {
				if (_.isArray(data)) {
					data.push(attId);
					$localForage.setItem(localCheckinCacheKeyName, data);					
				}
			}
			updateLocalCheckInCounterView();
		}); 
	};

	var undoLocalCheckInCounter = function(attId){
		$localForage.getItem(localCheckinCacheKeyName).then(function(data) {
			var indexFound = _.findIndex(data, function(id){ return id === attId; } );
			
			if (indexFound > -1) {
				data.splice(indexFound, 1);
				$localForage.setItem(localCheckinCacheKeyName, data);
			}
			updateLocalCheckInCounterView();
		}); 
	};

	var updateLocalCheckInCounterView = function(){
		$localForage.getItem(localCheckinCacheKeyName).then(function(data) {
			$scope.localCheckins = angular.isArray(data) ? data.length : 0;
		});
	};

	updateLocalCheckInCounterView();


})
.controller('AttendeeDetailCtrl', function ($scope, $modalInstance, attDetails) {

	$scope.attDetails = angular.copy(attDetails);

	$scope.newValue = function(key, value){
		
		$scope.attDetails[key] = value;
	};

	$scope.ok = function () {
		var json = JSON.stringify($scope.attDetails);
		
		$modalInstance.close(json);
	};

	$scope.cancel = function () {
		$modalInstance.dismiss('cancel');
	};

})
.controller('AddAttendeeCtrl', function ($scope, $modalInstance, fields) {

	$scope.fields = _.map(fields, function(f){ return {key:f,value:''}; });

	var newDetail = {};
	$scope.addEntry = function(field){
		
		
		newDetail[field.key] = field.value;
	};

	$scope.add = function(){
		
		var detailString = JSON.stringify(newDetail);
		$modalInstance.close(detailString);  
	};

	$scope.cancel = function () {
		$modalInstance.dismiss('cancel');
	};
});

