angular.module('sgDialogService',[])
//Version of dialog service
.constant("sgDialogService.version",[1,0,0])
//Configuration
.service("sgDialogService.config",[function(){
	return {
		//The default dialog template
		dialogTemplate : "sgDialogTemplate.html"
	}
}])
//Alert controller
.controller('sgDialogServiceAlertController',['$scope','modalInstance',function($scope,modalInstance){
	$scope.modalButtons =[
		{
			action:function(){modalInstance.dismiss();},
			text:"Ok",class:"btn-primary"
		}
	];
}])
//Confirm controller
.controller('sgDialogServiceConfirmController',['$scope','modalInstance',function($scope,modalInstance){
	$scope.cancelConfirm = function(){
		modalInstance.closeModal(false);
	}
	$scope.modalButtons =[
		{
			action:function(){modalInstance.closeModal(false);},
			text:"Cancel",class:"btn-default"
		},
		{
			action:function(){modalInstance.closeModal(true);},
			text:"Ok",class:"btn-primary"
		}
	];
}])
//Main service
.service('sgDialogService',['$http', '$templateCache', '$controller', '$compile','$rootScope','$document','sgDialogService.config',
	function($http, $templateCache, $controller, $compile,$rootScope,$document,sgDialogServiceConfig) {
		//Get the original dialog template
		var dialogTemplate =sgDialogServiceConfig.dialogTemplate;
		
		//Content of the main template body
		var dialogTemplateBody = "";
		//Lsit of dialog instances
		var dialogs = [];
		
		//To add a new dialog
		var pushDialog = function(modalInstance){
			if(dialogs.length>0){
				//Setup a fake id
				var id = "dialog"+dialogs.length;
				//Setup an overlay for the already shown dialog
				var hiddenOveraly = "<div class='modalHiddenOverlay modalOverlay' id='"+id+"' name='"+id+"'></div>";
				var last = dialogs[dialogs.length-1];
				//Add it on the previous
				last.dialog[0].appendChild($compile(hiddenOveraly)($rootScope)[0]);
			}
			dialogs.push(modalInstance);
		}
		
		//Remove the dialog
		var  popDialog = function(){
			var last = dialogs[dialogs.length-1]
			
			//Make the overlay invisibile
			if(dialogs.length==1){
				last.overlay.toggleClass('modalHidden');
			}
			
			//If exists some dialog still
			if(dialogs.length>1){
				var id = "dialog"+(dialogs.length-1);
				var dialogOverlay = document.getElementById(id);
				var parent = dialogOverlay.parentElement;
				parent.removeChild(dialogOverlay);
			}
			dialogs.pop();
			
			
			//Remove the dialog
			last.dialog.remove();
		}
		
		//Load the template content into the service local variable.
		//For this resource will be used the templateCache as...cache
		//The "dialogTemplate" is a constant that contains the template address
		$http.get(dialogTemplate, { cache: $templateCache })
			.then(function (response) {
				dialogTemplateBody = response.data;
			});
		
		//The overlay (the grey shade) is created to allow modal operations
		var overlay = document.getElementById("modalDialogOverlay");
		if(!overlay){
			var overlayContent = "<div id='modalDialogOverlay' name='modalDialogOverlay' class='modalDialogOverlay modalHidden modalOverlay'></div>";
			//Setup the overlay and append to context
			document.body.appendChild($compile(overlayContent)($rootScope)[0]);
		}
		
		this.alert = function(text,title){
			if(!title)title="Alert:";
			this.openModal({
				data:{
					title:title
				},
				template:"<span ng-controller='sgDialogServiceAlertController'>"+text+"</span>"
			});
		}
		
		this.confirm = function(text,callback,title){
			if(!title)title="Confirm:";
			this.openModal({
				data:{
					title:title
				},
				template:"<span ng-controller='sgDialogServiceConfirmController'>"+text+"</span>",
				callback:callback,
				closeModal:"cancelConfirm"
			});
		}
		
		var openModalInternal = function(contentTemplate,setup,modalInstance){	
			var controllerInView = false;
			//We search for the occurrences of the ng-controller string.
			//This is needed since angular...does not load the directive directly from the content
			//bu we want to allow the standard ng-controller syntax in dialog content
			if(!setup.controller){
				//Seek the first ng-controller
				var controller = contentTemplate.match(/ng-controller(\s\S)*=(\s\S)*("|')([^"']*)("|')/mi);
				if(controller!=null){
					//Get the name (the 4th match group)
					setup.controller = controller[4];
					//And remove it from the content
					contentTemplate = contentTemplate.replace(controller[0],"");
					controllerInView = true;
				}
			}
			
			if(!setup.templateUrl && !setup.template){
				throw "Must specify at least a template or a template Url!";
			}
			
			//The parameters are initialized
			defaultParameters(setup);
			//A new scope is created for the controller
			templateScope = setup.scope;
			if(!setup.scope){
				templateScope = $rootScope.$new();
			}else if(setup.controller){
				if(controllerInView){
					throw "Unable to use parent scope for openModal if a controller is specified on view: '"+setup.templateUrl+"'";
				}else{
					throw "Unable to use parent scope for openModal if a controller is specified in the call";
				}
			}
			
			//Setup the close function on a service
			modalInstance.dismiss = function(){
				//Simply remove the dialog
				popDialog();
			}
			
			//Setup the close function on a service
			modalInstance.closeModal = function(param){
				//Execute the optional callback
				if(setup.callback){
					setup.callback(param);
				}
				//Pop the dialog
				popDialog();
			}
			
			//Add the close function to the scope (for the close button!)
			templateScope[setup.closeModal] = modalInstance.closeModal;
			//Save the scope 
			modalInstance.scope = templateScope;
			
			
			//Copy the data on the template
			if(!setup.scope){
				//Only if its a new scope
				for(var prop in setup.data){
					templateScope[prop] = setup.data[prop];
				}
			}
						
			//Initialize the template injecting the dependencies
			if(setup.controller){
				//Force the default parameters for the scope
				$controller(setup.controller, { 
					$scope: templateScope,
					modalInstance: modalInstance
				});
			}
			
			//Set the modal title
			var realTemplate = dialogTemplateBody.replace("#modalTitle#","{{"+setup.title+"}}");
			
			//Set the iterator on the buttons
			realTemplate = realTemplate.replace("button in modalButtons","button in "+setup.modalButtons);
			
			//Insert the function to call to close the modal
			realTemplate = realTemplate.replace("#closeModal#",setup.closeModal+"()");
			//Insert the template into the dialog context
			realTemplate = realTemplate.replace("#modalBody#",contentTemplate);
			
			//Create the content
			var element = $compile(realTemplate)(templateScope);
			//And append at the end of body
			document.body.appendChild(element[0]);
			//Show the overaly
			if(dialogs.length==0){
				modalInstance.overlay.toggleClass('modalHidden');
			}
			//Save the instance of the scope
			modalInstance.dialog = angular.element(element);
			
			//When rendered place into the right place
			centerTheDialog(modalInstance);
			
			//Get the connected angular element
			var gripElement = angular.element(element[0].getElementsByClassName('modal-header'));
								
			//Bind the mousemove
			gripElement.bind('mousedown', function($event) {
				//Retrieve the absolute offset of the whole item
				modalInstance.startX = modalInstance.dialog.prop('offsetLeft');
				modalInstance.startY = modalInstance.dialog.prop('offsetTop');
				
				//Get the initiali mouse click
				modalInstance.initialMouseX = $event.clientX;
				modalInstance.initialMouseY = $event.clientY;
				
				//Prepare the functions
				modalInstance.mouseMove = function($event){ return mousemove($event,modalInstance);}
				modalInstance.mouseup = function(){ return mouseup(modalInstance);}
				
				//Bind the functions
				$document.bind('mousemove', modalInstance.mouseMove);
				$document.bind('mouseup', modalInstance.mouseup);
				return false;
			});
			
			pushDialog(modalInstance);
		}
		
		//Then a function is created to open the modal
		this.openModal = function(setup){
			 var modalInstance = {
				overlay : angular.element(document.getElementById("modalDialogOverlay")),
				startX:-1, 
				startY:-1,
				initialMouseX:-1, 
				initialMouseY:-1
			 };
			 
			
			if(setup.templateUrl){
				//The template is loaded from the resources
				$http.get(setup.templateUrl, { cache: $templateCache })
					.then(function (response) {
						openModalInternal(response.data,setup,modalInstance);
					});
			}else{
				openModalInternal(setup.template,setup,modalInstance);
			}
			return modalInstance;
		}
		
		//Setup a minimal set of parameters
		var defaultParameters = function(setup){
			if(!setup.data){setup.data = {};}
			if(!setup.title){setup.title = 'title';	}
			if(!setup.modalButtons){setup.modalButtons = 'modalButtons';}
			if(!setup.closeModal){setup.closeModal = 'closeModal';}
		}
		
		//Update the dialog positions upon mouse move
		var mousemove = function($event,modalInstance) {
				var dx = modalInstance.startX + ($event.clientX - modalInstance.initialMouseX);
				var dy = modalInstance.startY + ($event.clientY - modalInstance.initialMouseY);

				var style = {
					top:   dy + 'px',
					left:  dx + 'px'
				};
				//Force the css
				modalInstance.dialog.css(style);
				return false;
			}
	 
		//Disconnect the events when finishing moving
		var mouseup = function(modalInstance) {
			$document.unbind('mousemove', modalInstance.mousemove);
			$document.unbind('mouseup', modalInstance.mouseup);
		}
		
		//Center the dialog on the window
		var centerTheDialog = function(modalInstance){
			var w = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
	        var h = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
	        posWidth = w / 2 - modalInstance.dialog.prop('offsetWidth') / 2;
	        posHeight = h / 2 - modalInstance.dialog.prop('offsetHeight') / 2;


			modalInstance.dialog.css({
	            position: 'fixed',
	            left: posWidth + 'px',
	            top: posHeight + 'px'
			});
		}
	}
]);