angular.module('app.controllers', [])

.controller('generalCtrl', ['$scope', '$stateParams', 'authService', // The following is the constructor function for this page's controller. See https://docs.angularjs.org/guide/controller
// You can include any angular dependencies as parameters for this function
// TIP: Access Route Parameters for your page via $stateParams.parameterName
function ($scope, $stateParams, authService) {
    $scope.logout = function(){
        console.log("Logged out");
        authService.logout();
    }
    $scope.counterUntilOscars = function(){
        var d = new Date().getTime()/1000;
        if(d > 1488159000){
            return true;
        }
        else {
            return false;
        }
    }
}])

.controller('contestCtrl', ['$scope', '$stateParams', 'authService', '$state', // The following is the constructor function for this page's controller. See https://docs.angularjs.org/guide/controller
// You can include any angular dependencies as parameters for this function
// TIP: Access Route Parameters for your page via $stateParams.parameterName
function ($scope, $stateParams, authService, $state) {
    var counter = 1;
    var timeStart;
    var secondsToAdmin = 5;
    $scope.categories = [];
    $scope.nominees = [];
    $scope.accessManager = function(){
        var currTime = new Date().getTime()/1000;

        if(counter == 1){
            timeStart = new Date().getTime()/1000;
            counter++;
        }
        else if (counter == 6 && (currTime - timeStart) <= secondsToAdmin){
            console.log("Welcome Admin");
            $state.go('tabsController.manager');
            counter = 1;
        }
        else if(counter > 6 || (currTime - timeStart) > secondsToAdmin){
            counter = 1;
        }
        else{
            counter++;
            //console.log("I should see this three times");
        }
        //console.log(`Counter: ${counter}, timePassed: ${currTime - timeStart}, `);
    }
    fireDb.ref('categories').once('value', function(snapshot){
        $scope.categories = snapshot.val();
        console.log($scope.categories);
        snapshot.forEach(function (snap) {
            fireDb.ref('nominees').child(snap.val().name).once('value', function(snapMini){
                //console.log(snapMini.val());
                $scope.nominees.push(snapMini.val());
            });
        });
    });
    //console.log($scope.nominees);

    $scope.options = {
        loop: false,
        speed: 500,
    }

    $scope.$on("$ionicSlides.sliderInitialized", function(event, data){
        // data.slider is the instance of Swiper
        $scope.slider = data.slider;
    });

    $scope.$on("$ionicSlides.slideChangeStart", function(event, data){
        console.log('Slide change is beginning');
    });

    $scope.$on("$ionicSlides.slideChangeEnd", function(event, data){
        // note: the indexes are 0-based
        $scope.activeIndex = data.slider.activeIndex;
        $scope.previousIndex = data.slider.previousIndex;
    });

    $scope.answer = 4;
    $scope.userPick = 6;
}])

.controller('predictionsCtrl', ['$scope', '$stateParams', '$ionicSlideBoxDelegate', // The following is the constructor function for this page's controller. See https://docs.angularjs.org/guide/controller
// You can include any angular dependencies as parameters for this function
// TIP: Access Route Parameters for your page via $stateParams.parameterName
function ($scope, $stateParams, $ionicSlideBoxDelegate) {
    var oldVal;     // To keep track of selection index
    $scope.categories = [];
    $scope.nominees = [];
    $scope.data;
    $scope.options = {
        loop: false,
        speed: 500,
    }

    $scope.$on("$ionicSlides.sliderInitialized", function(event, data){
        // data.slider is the instance of Swiper
        $scope.slider = data.slider;
    });

    $scope.$on("$ionicSlides.slideChangeStart", function(event, data){
        console.log('Slide change is beginning');
    });

    $scope.$on("$ionicSlides.slideChangeEnd", function(event, data){
        // note: the indexes are 0-based
        console.log(`Slide has changed to ${data.slider.activeIndex}: ${$scope.categories[data.slider.activeIndex]}`);
        $scope.activeIndex = data.slider.activeIndex;
        $scope.previousIndex = data.slider.previousIndex;
    });

    fireDb.ref('categories').once('value', function(snapshot){
        //$scope.categories = snapshot.val();
        //console.log($scope.categories);
        snapshot.forEach(function (snap) {
            $scope.categories.push(snap.val().name);
            fireDb.ref('nominees').child(snap.val().name).once('value', function(snapMini){
                //console.log(snapMini.val());
                $scope.nominees.push(snapMini.val());
            });
        });
    });

    // Goes to slide on dropdown option change
    $scope.goToSlide = function(cat){
        var index = $scope.categories.indexOf(cat);
        //console.log(index);
        $scope.data.slider.slideTo(index);
    }

    $scope.myPredictions = function(){
        $scope.data.slider.slideTo(arrSize-1);
    }
    $scope.userPick = [];
    $scope.toggleSelection = function(value, index){
        var arrSize = $scope.nominees[index].length;
        $scope.userPick[index] = [arrSize];
        console.log(`OldVal: ${oldVal} & value: ${value}`);
        if(oldVal == value){
            return;
        }
        else{
            oldVal = value;
        }
        i = arrSize
        while(i--) $scope.userPick[index][i] = false;
        $scope.userPick[index][value] = true;
        console.log($scope.userPick[index][value]);
    }

}])

.controller('leaderboardCtrl', ['$scope', '$stateParams', // The following is the constructor function for this page's controller. See https://docs.angularjs.org/guide/controller
// You can include any angular dependencies as parameters for this function
// TIP: Access Route Parameters for your page via $stateParams.parameterName
function ($scope, $stateParams) {


}])

.controller('managerCtrl', ['$scope', '$stateParams', '$state', '$firebaseArray', // The following is the constructor function for this page's controller. See https://docs.angularjs.org/guide/controller
// You can include any angular dependencies as parameters for this function
// TIP: Access Route Parameters for your page via $stateParams.parameterName
function ($scope, $stateParams, $state, $firebaseArray) {
    $scope.category;
    $scope.addToDB = function(cat){
        var ref =  firebase.database().ref('categories/');
    	var categ = $firebaseArray(ref);
        $scope.serviceRef = categ;
        $scope.serviceRef.$add({
            name: cat,
        });
    }
}])

.controller('friendsCtrl', ['$scope', '$stateParams', // The following is the constructor function for this page's controller. See https://docs.angularjs.org/guide/controller
// You can include any angular dependencies as parameters for this function
// TIP: Access Route Parameters for your page via $stateParams.parameterName
function ($scope, $stateParams) {


}])

.controller('loginCtrl', ['$scope', '$stateParams', '$state', 'authService', // The following is the constructor function for this page's controller. See https://docs.angularjs.org/guide/controller
// You can include any angular dependencies as parameters for this function
// TIP: Access Route Parameters for your page via $stateParams.parameterName
function ($scope, $stateParams, $state, authService) {
    authService.checkLogin();
    $scope.login = function(user){
        //console.log(user);
        authService.login(user);
    }
}])

.controller('registerCtrl', ['$scope', '$stateParams', '$state', 'authService', // The following is the constructor function for this page's controller. See https://docs.angularjs.org/guide/controller
// You can include any angular dependencies as parameters for this function
// TIP: Access Route Parameters for your page via $stateParams.parameterName
function ($scope, $stateParams, $state, authService){
    $scope.register = function(user){
        //console.log(user);
        authService.createUser(user);
    }
}])

.controller('landingCtrl', ['$scope', '$stateParams', '$timeout', '$state', // The following is the constructor function for this page's controller. See https://docs.angularjs.org/guide/controller
// You can include any angular dependencies as parameters for this function
// TIP: Access Route Parameters for your page via $stateParams.parameterName
function ($scope, $stateParams, $timeout, $state) {
    $timeout(function () {
        $state.go('login');
    }, 2000);
}])
