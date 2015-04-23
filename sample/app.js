var myApp = angular.module('myApp',['sgDialogService']);

myApp.run(["sgDialogService.config",function(sgDialogServiceConfig){
	sgDialogServiceConfig.dialogTemplate = "lib/sgDialogTemplate.html";
}]);

myApp.controller('myController',['sgDialogService','$scope',function(sgDialogService,$scope){
	$scope.callbackResult = "No callbacks yet";
	$scope.dialogTitle = "Dialog title";
	$scope.openDialog = function(dialogParam){
		sgDialogService.openModal({
				templateUrl:'sample/dialogContent.html',
				data:{fromParent:dialogParam},
				callback: function(result){ $scope.callbackResult=result;}
			});
		}
		
	$scope.openAlert = function(text){
		sgDialogService.alert(text);
	}
		
	$scope.openConfirm = function(text){
		sgDialogService.confirm(text,function(result){
			$scope.confirmResult = result;
		});
	}
}]);

myApp.controller('dialogController',['modalInstance','$scope','sgDialogService',function(modalInstance,$scope,sgDialogService){
	$scope.forCallback = "Return to caller";
	$scope.title = $scope.fromParent;
	$scope.subDialogValue = "Sub dialog value";
	$scope.modalButtons =[
		{
			action:function(){modalInstance.dismiss();},
			text:"Cancel",class:"btn-default"
		},
		{
			action:function(){modalInstance.closeModal($scope.forCallback);},
			text:"Ok",class:"btn-primary",
			disabled: function(){ if($scope.callbackForm) return $scope.callbackForm.$invalid || !$scope.callbackForm.$dirty;}
		}
	];
	
	$scope.openSubDialog = function(subDialogValue){
				sgDialogService.openModal(
				{
					templateUrl:'sample/subDialogContent.html',
					data:{subDialogValue:subDialogValue}
				})
	}
	
	$scope.openAlert = function(text){
		sgDialogService.alert(text);
	}
}]);

myApp.controller('subDialogController',['modalInstance','$scope',function(modalInstance,$scope){
	$scope.title = "Sub Dialog";
	$scope.modalButtons =[
		{
			action:function(){modalInstance.dismiss();},
			text:"Close",class:"btn-default"
		}
	];
}]);