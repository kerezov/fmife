//all angular code for our app 
// public/core.js
$(document).ready(function() {
	$('#toggleAdvanced').prop('checked', false);
	$('#advancedSearch').fadeOut(0);
	$('.success').fadeOut(0);
	$('.errors').fadeOut(0);
	$('#sortField').val('ByName');
	$('#sortOrder').val('Type');
});

$(window).resize(function () {
	togglePopovers();
});

var fmiFe = angular.module('fmiFe', []);

angular.module('fmiFe').filter('pagination', function() {
	return function(input, start)
	{
		start = +start;
		return input.slice(start);
	};
});

fmiFe.directive('bsPopover', function() {
    return function(scope, element, attrs) {
        element.find("a[rel=popover]").popover({ placement: 'right', html: 'true'});
    };
});

function mainController($scope, $http, orderByFilter) {
	$scope.formData = {};
	$scope.newField = {};
	$scope.predicate = '';
	$scope.typePredicate = '';
	$scope.search = {};
	$scope.strict = {};
	$scope.searchText = "";
	$scope.curPage = 0;
	$scope.pageSize = 5;
	var regexForDigitsNormal = /^\d{10}$/;
	var regexForDigitsSpecial = /^\+\d{10,}$/;
	var numberPerPageForSearch = 200;
	var pageSizeDefault = 5;
	
	$http.get('/api/phoneBook').success(function(data) {
			$scope.entries = data;
			if($scope.entries.length > $scope.pageSize) {
				$('.pagination').css('visibility', 'visible');
			}
			else {
				$('.pagination').css('visibility', 'hidden');
			}
		}).error(function(data) {
			console.log('Error: ' + data);
	});
	
	$scope.createEntry = function() {
		if (Object.keys($scope.formData).length == 3) {
			var match = $scope.formData.Number.match(regexForDigitsNormal) || $scope.formData.Number.match(regexForDigitsSpecial);
			if (match !== null){
				$http.post('/api/phoneBook', $scope.formData).success(function(data) {
						$scope.formData = {};
						$scope.entries = data;
						if($scope.entries.length > $scope.pageSize) {
							$('.pagination').css('visibility', 'visible');
						}
						else {
							$('.pagination').css('visibility', 'hidden');
						}
					}).error(function(data) {
						console.log('Error: ' + data);
					});
				clearErrors();
				clearSuccess();
				showSuccess();					
			}else {
				clearErrors();
				showErrors();
			}
		}
	};
	
	$(document).on("click", ".popOver-yes", function() {
		$http.delete('/api/phoneBook/'+ this.id).success(function(data) {
				$scope.entries = data;
				if($scope.entries.length > $scope.pageSize) {
					$('.pagination').css('visibility', 'visible');
				}
				else {
					$('.pagination').css('visibility', 'hidden');
				}
				if($scope.entries.length % $scope.pageSize === 0) {
					$scope.curPage = $scope.curPage -1;
				}
				if($scope.entries.length === 0) {
					$scope.curPage = 0;
				}
				clearSuccess();
				showSuccess();
			}).error(function(data) {
				console.log('Error: ' + data);
			});
	});
	
	$(document).on("click", ".popOver-no", function() {
		//go back through the nested items until we reach the outer most div
		//then select its 2-nd child, which is the targeted anchor tag
		$(this.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.childNodes[1]).click();
	});
	
	$scope.editEntry = function(field) {
        $scope.newField = angular.copy(field);
		if($('#exactMatch').prop('checked', true)) {
			$('#exactMatch').prop('checked', false);
		}
    };
    
    $scope.saveEntry = function(entry) {
		var match = entry.Number.match(regexForDigitsNormal) || entry.Number.match(regexForDigitsSpecial);
		if (match !== null){
            $http.put('/api/phoneBook/'+ entry._id, entry).success(function(data) {
					$scope.entries = data;
					$scope.sort();
				}).error(function(data) {
					console.log('Error: ' + data);
				});
			editMode = false;
			clearSuccess();
			showSuccess();
		}else {
				editMode = true;
				clearErrors();
				showErrors();
		}
    };
    
    $scope.cancel = function() {
		$http.get('/api/phoneBook').success(function(data) {
				$scope.entries = data;
			}).error(function(data) {
				console.log('Error: ' + data);
		});
		clearErrors();
    };
	
	$scope.changePredicate = function() {
		if($('#sortOrder option:selected').val() == "asc") {
			$scope.predicate = $scope.typePredicate;
		} else if ($('#sortOrder option:selected').val() == "desc") {
			$scope.predicate = "-" + $scope.typePredicate;
		}
    };
	
	$scope.changeField = function() {
		if($('#sortField option:selected').val() == "fName") {
			$scope.typePredicate = "Fname";
		} else {
			$scope.typePredicate = "Lname";
		}
		if($('#sortOrder').val() !== null) {
			$scope.changePredicate();
		}
    };
	
	$scope.toggleAdvancedSearch = function() {
		if($('#toggleAdvanced').is(':checked')) {
			$('#advancedSearch').css("visibility", "visible");
			$('#advancedSearch').fadeIn(1000);
			$scope.searchText = "";
			$('.basicSearch').fadeOut(800);
			$('.pagination').css('visibility', 'hidden');
			$scope.curPage = $scope.curPage - numberPerPageForSearch;
			$scope.pageSize = numberPerPageForSearch;
			console.log($scope.curPage);
			togglePopovers();
		}
		else {
			$('#advancedSearch').fadeOut(800);
			$('#exactMatch').prop('checked', false);
			$scope.search = "";
			$scope.strict = "";	
			$('.basicSearch').fadeIn(800);
			$('.pagination').css('visibility', 'visible');
			$scope.curPage = $scope.curPage + numberPerPageForSearch;
			$scope.pageSize = pageSizeDefault;
			if($scope.curPage > Math.ceil($scope.entries.length / $scope.pageSize) - 1) {
				$scope.curPage = $scope.curPage -1;
			}
			if($scope.curPage === 0  && (Math.ceil($scope.entries.length / $scope.pageSize) - 1) === 0) {
				$('.pagination').css('visibility', 'hidden');
			}
			if($scope.curPage < 0) {
				if($scope.pageSize >= pageSizeDefault) {
					$scope.curPage += 1;
				}
				else {
					$scope.curPage = 0;
					$('.pagination').css('visibility', 'hidden');
				}
			}
			togglePopovers();			
		}
	};
	
	$scope.numberOfPages = function() {
		return Math.ceil($scope.entries.length / $scope.pageSize);
	};
	
	$('.searchText').focusin( function() {
			$scope.curPage = $scope.curPage - numberPerPageForSearch;
			$scope.pageSize = numberPerPageForSearch;
			$http.get('/api/phoneBook').success(function(data) {
					$scope.entries = data;
					if($scope.entries.length > $scope.pageSize) {
						$('.pagination').css('visibility', 'visible');
					}
					else {
						$('.pagination').css('visibility', 'hidden');
					}
				}).error(function(data) {
					console.log('Error: ' + data);
			});
	});
	
	$('.searchText').focusout( function() {
			$scope.curPage = $scope.curPage + numberPerPageForSearch;
			$scope.pageSize = pageSizeDefault;
			$scope.searchText = "";
			$http.get('/api/phoneBook').success(function(data) {
					$scope.entries = data;
					if($scope.entries.length > $scope.pageSize) {
						$('.pagination').css('visibility', 'visible');
					}
					else {
						$('.pagination').css('visibility', 'hidden');
					}
				}).error(function(data) {
					console.log('Error: ' + data);
			});
	});
	
	$scope.sort = function() {
		$http.get('/api/phoneBook').success(function(data) {
				$scope.sortedData = orderByFilter(data, $scope.predicate);
				$scope.entries = $scope.sortedData;
				if($scope.entries.length > $scope.pageSize) {
					$('.pagination').css('visibility', 'visible');
				}
				else {
					$('.pagination').css('visibility', 'hidden');
				}
			}).error(function(data) {
				console.log('Error: ' + data);
			});
	};
}

function clearErrors() {
	$('.errors').css("visibility", "hidden");
	$('.errors').fadeOut(0);
	$('.errors').empty();
}

function showErrors() {
	$('.errors').css("visibility", "visible");
	$('.errors').fadeIn(0);
	$('.errors').append('<i class="glyphicon glyphicon-remove-circle"></i> Please enter a valid phonenumber');
	
	setTimeout( function(){
		$('.errors').fadeOut(1500);
	}
	, 2000 );
}

function clearSuccess() {
	$('.success').css("visibility", "hidden");
	$('.success').fadeOut(0);
	$('.success').empty();
}

function showSuccess() {
	$('.success').css("visibility", "visible");
	$('.success').fadeIn(0);
	$('.success').append('<i class="glyphicon glyphicon-saved"></i> Success');
	
	setTimeout( function(){
		$('.success').fadeOut(1200);
	}
	, 1200 );
}
function togglePopovers() {
	var visiblePopovers = $(".counter").filter(':visible');
	var number = visiblePopovers.length;
	for(var i = 0; i < number; i++) {
		$("a[name=" + visiblePopovers[i].id + "]").click();
	}
}