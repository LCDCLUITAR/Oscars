angular.module('app.controllers', [])
.controller('generalCtrl', ['$scope', '$stateParams', 'authService', '$window', '$interval', '$state', 'globals',// The following is the constructor function for this page's controller. See https://docs.angularjs.org/guide/controller
// You can include any angular dependencies as parameters for this function
// TIP: Access Route Parameters for your page via $stateParams.parameterName
function ($scope, $stateParams, authService, $window, $interval, $state, globals) {
    var promiseInterval;
    var epochDate = 1488153600;
    var testEpoch = 1487712660;
    var counter = 1;
    var timeStart;
    var secondsToAdmin = 5;
    $scope.managerAccess = false;
    $scope.logout = function(){
        //console.log("Logged out");
        authService.logout();
    }
    $scope.counterUntilOscars = function(){
        var d = new Date().getTime()/1000;
        d = Math.floor(d);
        //console.log(d);
        if(d == testEpoch){
            alert('Live contest is starting. Predictions closed');
            $state.go('landing');
            $window.location.reload();
        }
        else if(d < testEpoch){
            //console.log("Timer is over");
            globals.setEventStart(true);
            return true;
        }
        else{
            //console.log("Timer Still going");
            return false;
        }
    }
    // Function to access manager mode
    $scope.accessManager = function(){
        var currTime = new Date().getTime()/1000;
        if(counter == 1){
            timeStart = new Date().getTime()/1000;
            counter++;
        }
        else if (counter == 5 && (currTime - timeStart) <= secondsToAdmin){
            //console.log("Welcome Admin");
            var user = firebase.auth().currentUser;
            if(user.uid == "voGZjbyBKnY0pLVbfQxqi2WLV5k2"){
                $scope.managerAccess = true;
                $state.go('tabsController.manager');
                counter = 1;
            }
            else{
                alert("You are not allowed here...");
            }
        }
        else if(counter > 5 || (currTime - timeStart) > secondsToAdmin){
            counter = 1;
        }
        else{
            counter++;
            //console.log("I should see this three times");
        }
        //console.log(`Counter: ${counter}, timePassed: ${currTime - timeStart}, `);
    }
}])

.controller('contestCtrl', ['$scope', '$stateParams', 'authService', '$state', '$ionicSlideBoxDelegate', '$timeout', '$window', '$ionicLoading',
// You can include any angular dependencies as parameters for this function
// TIP: Access Route Parameters for your page via $stateParams.parameterName
function ($scope, $stateParams, authService, $state, $ionicSlideBoxDelegate, $timeout, $window, $ionicLoading){
    $ionicLoading.show({
        template: '<div class="loader"><ion-spinner class="spinner-energized" icon="lines"></ion-spinner></div>'
    });

    $timeout(function () {
        $ionicLoading.hide();
    }, 1500);

    //console.log("Controller contest");
    $scope.categories = [];
    $scope.nominees = [];
    $scope.awardWinner = [];
    $scope.userNomineeSel = [];
    $scope.earnedPoints = [];
    $scope.topThree = [];
    $scope.userPoints = 0;
    $scope.refresh = true;
    $scope.userPhotoURL = "img/default.png";
    $scope.userPhotoURL = authService.getUser();
    $scope.data;
    /*==================
    --- DB STUFF
    ===================*/
    var refUserPoints =  firebase.database().ref('users/');
    refUserPoints.on('value', function(snapshot){
        $scope.userPhotoURL = authService.getUser();
        //console.log($scope.userPhotoURL.photo);
        snapshot.forEach(function(snap){
            var elementPos = $scope.topThree.map(function(x) {return x.userKey; }).indexOf(snap.key);
            if(elementPos == -1){
                $scope.topThree.push({
                    points: snap.val().points,
                    name: snap.val().displayName,
                    photo: snap.val().photoURL,
                    userKey: snap.key
                });
            }
            else {
                $scope.topThree[elementPos] = {
                    points: snap.val().points,
                    name: snap.val().displayName,
                    photo: snap.val().photoURL,
                    userKey: snap.key
                };
            }
        });
        $scope.topThree.sort(function(a, b){ return b.points - a.points});
        if(!$scope.$$phase) {
            $scope.$apply();
        }
        //console.log($scope.topThree);
    });

    //listen for changes in user points
    var refUser = firebase.database().ref('users/'+authService.getUser().uid+'/points');
    refUser.on("value", function(snapVal){
        if(snapVal.exists()){
            //console.log(`Updating user points... ${snapVal.val()}`);
            $scope.userPoints = snapVal.val();
            if(!$scope.$$phase) {
                $scope.$apply();
            }
        }
    });
    // Get categories
    fireDb.ref('categories').orderByChild('index').once('value', function(snapshot){
        snapshot.forEach(function (snap) {
            $scope.categories.push(snap.val().name);
            // Get nominees
            fireDb.ref('nominees').child(snap.val().name).once('value', function(snapMini){
                //console.log(snapMini.val());
                $scope.nominees.push(snapMini.val());
            });
        });
        // Get award winners if any
        var refWin =  firebase.database().ref('awardWinners/');
        refWin.on('value', function(snapshot) {
            if(snapshot.exists()){
                snapshot.forEach(function (snap){
                    var indexCat = $scope.categories.indexOf(snap.val().category);
                    $scope.awardWinner[indexCat] = {winner: snap.val().winner, isActive: true};
                });
                if(!$scope.$$phase) {
                    $scope.$apply();
                }
            }
        });
        // Get nominees once categories are added to scope
        var refs =  firebase.database().ref('predictions/' + authService.getUser().uid);
        refs.once("value", function(snapshot){
            snapshot.forEach(function (snap) {
                if(snap.exists()){
                    var indexCat = $scope.categories.indexOf(snap.val().category);
                    var indexNominee = $scope.nominees[indexCat].indexOf(snap.val().nominee);
                    //console.log(`IndexCat: ${indexCat}, indexNominee: ${indexNominee}`);
                    $scope.userNomineeSel[indexCat] = {
                        nominee: $scope.nominees[indexCat][indexNominee],
                        points: 0,
                    };
                }
            });
            // Get points once nominees are added to scope
            var refPoints =  firebase.database().ref('categoryPoints/');
            refPoints.once("value", function(snapshot){
                snapshot.forEach(function (snap) {
                    if(snap.exists()){
                        var indexCat = $scope.categories.indexOf(snap.val().category);
                        //If user has made predictions
                        if($scope.userNomineeSel[indexCat]){
                            $scope.userNomineeSel[indexCat].points = Math.ceil( (snap.val().points / snap.val().users) );
                        }
                        else{
                            $scope.userNomineeSel[indexCat] = {
                                nominee: "",
                                points: Math.ceil( (snap.val().points / snap.val().users) )
                            };
                        }
                    }
                });
            }, function (err) {
                console.log("The read failed: " + err.code);
            });

        }, function (err) {
            console.log("The read failed: " + err.code);
        });
    });

    /*======================
    --- END OF DB STUFF
    =======================*/

    $scope.options = {
        loop: false,
        speed: 500,
    }

    $scope.$on("$ionicSlides.sliderInitialized", function(event, data){
        // data.slider is the instance of Swiper
        $scope.slider = data.slider;
        $scope.activeIndex = 0;
    });

    $scope.$on("$ionicSlides.slideChangeStart", function(event, data){
        //console.log('Slide change is beginning');
    });

    $scope.$on("$ionicSlides.slideChangeEnd", function(event, data){
        // note: the indexes are 0-based
        $scope.activeIndex = data.slider.activeIndex;
        $scope.previousIndex = data.slider.previousIndex;
    });

    // Slide button controllers
    $scope.goToSlideCtrl = function(direction){
        //console.log("Go to slide ctrl");
        //console.log(direction);
        if(direction == 'next')
            $scope.data.slider.slideTo($scope.activeIndex+1);
        else
            $scope.data.slider.slideTo($scope.activeIndex-1);
    }
    // Goes to slide on dropdown option change
    $scope.goToSlide = function(cat){
        var index = $scope.categories.indexOf(cat);
        //console.log(index);
        $scope.data.slider.slideTo(index);
    }
    $scope.goToSlideByIndex = function(index){
        $scope.data.slider.slideTo(index);
    }
}])

.controller('predictionsCtrl', ['$scope', '$stateParams', '$ionicSlideBoxDelegate', 'authService', '$firebaseAuth', '$firebaseArray', '$ionicPopup', 'globals', '$ionicLoading', '$timeout',
// You can include any angular dependencies as parameters for this function
// TIP: Access Route Parameters for your page via $stateParams.parameterName
function ($scope, $stateParams, $ionicSlideBoxDelegate, authService, $firebaseAuth, $firebaseArray, $ionicPopup, globals, $ionicLoading, $timeout){
    $ionicLoading.show({
        template: '<div class="loader"><ion-spinner class="spinner-energized" icon="lines"></ion-spinner></div>'
    });

    $timeout(function () {
        $ionicLoading.hide();
    }, 1500);
    // Variables
    $scope.userPhotoURL = "img/default.png";
    $scope.userPhotoURL = authService.getUser();
    $scope.eventStarted = globals.getEventStart();
    //console.log($scope.eventStarted);
    $scope.categories = [];
    $scope.nominees = [];
    $scope.data;
    $scope.userPick = [];
    $scope.userNomineeSel = [];
    $scope.userShowPredictions = [];
    $scope.categoryPoints = [];
    var isUserChosenPoints = [];
    $scope.userCatCounter = 0;
    $scope.userPredicted = authService.getUser().predictions;
    //console.log(authService.getUser());
    /*
    --- Slider Page Events and options
    */
    $scope.options = {
        loop: false,
        speed: 500,
    }
    $scope.$on("$ionicSlides.sliderInitialized", function(event, data){
        // data.slider is the instance of Swiper
        $scope.slider = data.slider;
        $scope.activeIndex = 0;
    });

    $scope.$on("$ionicSlides.slideChangeStart", function(event, data){
        //console.log('Slide change is beginning');
    });

    $scope.$on("$ionicSlides.slideChangeEnd", function(event, data){
        // note: the indexes are 0-based
        //console.log(`Slide has changed to ${data.slider.activeIndex}: ${$scope.categories[data.slider.activeIndex]}`);
        $scope.activeIndex = data.slider.activeIndex;
        $scope.previousIndex = data.slider.previousIndex;
    });
    /*
    --- END of Slider Page Events and options
    */

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

        var refs =  firebase.database().ref('predictions/' + authService.getUser().uid);
        refs.once("value", function(snapshot){
            snapshot.forEach(function (snap) {
                $scope.userCatCounter++;
                //console.log(snap.val());
                var indexCat = $scope.categories.indexOf(snap.val().category);
                var indexNominee = $scope.nominees[indexCat].indexOf(snap.val().nominee);
                //console.log(`IndexCat: ${indexCat}, indexNominee: ${indexNominee}`);
                $scope.userNomineeSel[indexCat] = $scope.nominees[indexCat][indexNominee];
                $scope.userShowPredictions.push({
                    category: $scope.categories[indexCat],
                    nominee: $scope.nominees[indexCat][indexNominee],
                    pointsPicked: snap.val().pointsPicked,
                    catIndex: indexCat
                });
            });
            if(!$scope.$$phase) {
                $scope.$apply();
            }
            //console.log($scope.userNomineeSel);
            //console.log("Child Updated");
        }, function (err) {
            console.log("The read failed: " + err.code);
        });

        // Gets category points if any
        fireDb.ref('categoryPoints').on('value', function(snapshot){
            if(snapshot.exists()){
                //console.log(snapshot.val());
                snapshot.forEach(function (snap) {
                    //console.log(snap.val());
                    var index = $scope.categories.indexOf(snap.val().category)
                    $scope.categoryPoints[index] = {
                        category: snap.val().category,
                        points: Math.ceil(snap.val().points / snap.val().users)
                    };
                });
            }
        });
    });

    // Slide button controllers
    $scope.goToSlideCtrl = function(direction){
        //console.log("Go to slide ctrl");
        //console.log(direction);
        if(direction == 'next')
            $scope.data.slider.slideTo($scope.activeIndex+1);
        else
            $scope.data.slider.slideTo($scope.activeIndex-1);
    }
    // Goes to slide on dropdown option change
    $scope.goToSlide = function(cat){
        var index = $scope.categories.indexOf(cat);
        //console.log(index);
        $scope.data.slider.slideTo(index);
    }
    $scope.goToSlideByIndex = function(index){
        $scope.data.slider.slideTo(index);
    }

    $scope.myPredictions = function(){
        $scope.data.slider.slideTo($scope.categories.length);
    }

    $scope.toggleSelection = function(indexNominee, indexCat){
        $scope.userNomineeSel[indexCat] = $scope.nominees[indexCat][indexNominee];
        $scope.userCatCounter = $scope.userNomineeSel.filter(function(value) { return value !== undefined }).length;
        //console.log($scope.nominees);
        //console.log(`User Selected: ${$scope.nominees[indexCat][indexNominee]} from ${$scope.categories[indexCat]}`);


        var categoryFound = false;
        for(var i = 0; i < $scope.userShowPredictions.length; i++) {
            // Update local categories and nominations if a new prediction is being done
            if($scope.userShowPredictions[i].category === $scope.categories[indexCat]) {
                $scope.userShowPredictions[i].catIndex = indexCat;
                $scope.userShowPredictions[i].nominee = $scope.nominees[indexCat][indexNominee];
                categoryFound = true;
                if($scope.userShowPredictions[i].pointsPicked === true){
                    isUserChosenPoints[indexCat] = true;
                    $scope.userShowPredictions[i].pointsPicked = true;
                    //console.log($scope.userShowPredictions[i].pointsPicked);
                }
            }
        }
        if(!isUserChosenPoints[indexCat]){
            isUserChosenPoints[indexCat] = false;
        }
        //console.log(`point before DB: ${isUserChosenPoints[indexCat]}`);
        var userId = authService.getUser().uid;
        //console.log(userId);
        var ref =  firebase.database().ref('predictions/' + authService.getUser().uid + '/' + $scope.categories[indexCat]);
        ref.set({
            category: $scope.categories[indexCat],
            nominee: $scope.nominees[indexCat][indexNominee],
            pointsPicked: isUserChosenPoints[indexCat]
        });
        if(!categoryFound){
            $scope.userShowPredictions.push({
                category: $scope.categories[indexCat],
                nominee: $scope.nominees[indexCat][indexNominee],
                catIndex: indexCat
            });
        }
        // If user hasnt predicted prompt him to do it in user interface
        if(!$scope.userPredicted){
            //console.log("User predicted");
            if(authService.getUser().uid){
                firebase.database().ref('users/'+authService.getUser().uid+'/predictions').set(true);
                $scope.userPredicted = true;
            }
        }
        if(!isUserChosenPoints[indexCat]){
            $scope.data2 = {};
            // An elaborate, custom popup
            var myPopup = $ionicPopup.show({
                template: '<input type="number" min="10" max="100" step="5" ng-model="data2.points">',
                title: 'How many points do you think this category is worth?',
                subTitle: 'You may only vote once',
                scope: $scope,
                buttons: [
                    { text: 'Maybe later' },
                    {
                        text: '<b>Save</b>',
                        type: 'button-positive',
                        onTap: function(e) {
                            //console.log($scope.data2.points);
                            if (!$scope.data2.points) {
                                alert("Choose a number from 10-100");
                                e.preventDefault();
                            } else {
                                //console.log("Returning");
                                return $scope.data2.points;
                            }
                        }
                    }
                ]
            });
            myPopup.then(function(res){
                //console.log('Tapped!', res);
                if(typeof res !== 'undefined'){
                    //console.log(res);
                    isUserChosenPoints[indexCat] = true;
                    var userId = authService.getUser().uid;
                    var refToCategoryPoints =  firebase.database().ref('categoryPoints/').child($scope.categories[indexCat]);
                    var ref =  firebase.database().ref('predictions/' + userId + '/' + $scope.categories[indexCat]);
                    ref.set({
                        category: $scope.categories[indexCat],
                        nominee: $scope.nominees[indexCat][indexNominee],
                        pointsPicked: true
                    });

                    refToCategoryPoints.once('value', function(snapshot) {
                        if(snapshot.exists()) {
                            var pointsDB = snapshot.val().points;
                            var usersCount = snapshot.val().users;
                            usersCount++;
                            pointsDB += res;
                            //console.log(pointsDB);
                            refToCategoryPoints.update({
                                points: pointsDB,
                                users: usersCount
                            });
                        } else {
                            refToCategoryPoints.set({
                                category: $scope.categories[indexCat],
                                points: res,
                                users: 1
                            });
                        }
                    });
                }
            });
        }
    }
}])

.controller('leaderboardCtrl', ['$scope', '$stateParams', 'authService', // The following is the constructor function for this page's controller. See https://docs.angularjs.org/guide/controller
// You can include any angular dependencies as parameters for this function
// TIP: Access Route Parameters for your page via $stateParams.parameterName
function ($scope, $stateParams, authService) {
    $scope.topThree = [];
    $scope.userPhotoURL = authService.getUser();

    var refUserPoints =  firebase.database().ref('users/');
    refUserPoints.on('value', function(snapshot){
        $scope.userPhotoURL = authService.getUser();
        snapshot.forEach(function(snap){
            var elementPos = $scope.topThree.map(function(x) {return x.userKey; }).indexOf(snap.key);
            if(elementPos == -1){
                $scope.topThree.push({
                    points: snap.val().points,
                    name: snap.val().displayName,
                    photo: snap.val().photoURL,
                    userKey: snap.key
                });
            }
            else {
                $scope.topThree[elementPos] = {
                    points: snap.val().points,
                    name: snap.val().displayName,
                    photo: snap.val().photoURL,
                    userKey: snap.key
                };
            }
        });
        $scope.topThree.sort(function(a, b){ return b.points - a.points});
        if(!$scope.$$phase) {
            $scope.$apply();
        }
        //console.log($scope.topThree);
    });
}])

.controller('managerCtrl', ['$scope', '$stateParams', '$state', '$firebaseArray', 'authService', // The following is the constructor function for this page's controller. See https://docs.angularjs.org/guide/controller
// You can include any angular dependencies as parameters for this function
// TIP: Access Route Parameters for your page via $stateParams.parameterName
function ($scope, $stateParams, $state, $firebaseArray, authService) {
    $scope.categories = [];
    $scope.nominees = [];
    $scope.categorySelected = "BEST PICTURE";
    $scope.categorySelected2 = "BEST PICTURE";
    $scope.categorySelected3 = "BEST PICTURE";
    $scope.nomineeSelected;

    $scope.updateIndexCateg = function(oldCat, newCat){
        var oldIndex = $scope.categories.indexOf(oldCat);
        var newIndex = $scope.categories.indexOf(newCat);
        var ref =  firebase.database().ref('categories/');
        ref.once('value', function(snapshot) {
            snapshot.forEach(function(snap){
                //console.log(`OldCat: ${oldCat}, newCat: ${newCat}, CurrCat: ${snap.val().name}`);
                if(snap.val().name == oldCat){
                    firebase.database().ref('categories/'+snap.key+'/index').set(newIndex);
                }
                else if(snap.val().name == newCat){
                    firebase.database().ref('categories/'+snap.key+'/index').set(oldIndex);
                }
            });
        });
    }

    $scope.winnerSelected = function(champ, category){
        //console.log(`champ: ${champ}, cat: ${category}`);
        var ref =  firebase.database().ref('awardWinners/'+category);
        ref.once('value', function(snapshot) {
            var updated = false;
            var prevWinner;
            if(snapshot.exists()) {
                updated = true;
                //console.log(`Update, previous winner was: ${snapshot.val().winner}`);
                prevWinner = snapshot.val().winner;
                ref.update({
                    winner: champ,
                });
            }
            else {
                //console.log("New record");
                var yearAward = new Date().getFullYear();
                ref.set({
                    category: category,
                    winner: champ,
                    year: yearAward
                });
            }
            // Update all users after winner is selected
            // Get user nominee if there is one
            var refUsers =  firebase.database().ref('users/');
            refUsers.once("value", function(snapshotUsers){
                // For each user
                snapshotUsers.forEach(function(snap){
                    if(snap.val().predictions){
                        //console.log(`User: ${snap.val().displayName} made a prediction`);
                        var refGuess =  firebase.database().ref('predictions/' + snap.key+'/'+category+'/nominee');
                        refGuess.once("value", function(snapshotGuess){
                            if(snapshotGuess.exists()){
                                //console.log(`User: ${snap.val().displayName} made a guess on ${category} about ${snapshotGuess.val()}`);
                                // If user guessed correctly
                                if(snapshotGuess.val() == champ){
                                    //console.log(`${snap.val().displayName} made the right prediction... adding points`);
                                    var refPoints = firebase.database().ref('categoryPoints/'+category);
                                    refPoints.once("value", function(snapPoint){
                                        var points = Math.ceil(snapPoint.val().points / snapPoint.val().users);
                                        var ref = firebase.database().ref('users/'+snap.key);
                                        ref.child('points').once("value", function(snapVal){
                                            //console.log(`${snap.val().displayName} has ${snapVal.val()} points... adding ${points}`);
                                            points += snapVal.val();
                                            //console.log(`${snap.val().displayName} now has ${points} points`);
                                            ref.update({
                                                points: points
                                            });
                                        });
                                    });
                                }
                                else if(updated && snapshotGuess.val() == prevWinner){
                                    //console.log(`There was an update and ${snap.val().displayName} guessed wrong`);
                                    // No match
                                    var refPoints = firebase.database().ref('categoryPoints/'+category);
                                    refPoints.once("value", function(snapPoint){
                                        var pointsUpdate = Math.ceil(snapPoint.val().points / snapPoint.val().users);
                                        //console.log(`Points to subtract: ${pointsUpdate} from ${snap.val().displayName}`);
                                        var ref = firebase.database().ref('users/'+snap.key);
                                        ref.child('points').once("value", function(snapVal){
                                            //console.log(`${snap.val().displayName} has: ${snapVal.val()} points`);
                                            pointsUpdate = snapVal.val() - pointsUpdate;
                                            //console.log(`After update, ${snap.val().displayName} has: ${pointsUpdate} points`);
                                            ref.update({
                                                points: pointsUpdate
                                            });
                                        });
                                    });
                                }else{
                                    //console.log(`${snap.val().displayName} guessed wrong after and before update`);
                                }// If user predicted on this category
                            }else{
                                //console.log(`${snap.val().displayName} did not predict on this category`);
                            }// If user predicted on this category
                        });
                    }// If user predicted
                });
            });
        });
    }

    fireDb.ref('categories').once('value', function(snapshot){
        var i = 0;
        snapshot.forEach(function (snap) {
            $scope.categories.push(snap.val().name);
            fireDb.ref('nominees').child(snap.val().name).once('value', function(snapMini){
                snapMini.forEach(function (snap2) {
                    $scope.nominees.push({
                        name: snap2.val(),
                        category: snap.val().name
                    });
                });
            });
        });
        //console.log($scope.categories);
    });
}])

.controller('loginCtrl', ['$scope', '$stateParams', '$state', 'authService', // The following is the constructor function for this page's controller. See https://docs.angularjs.org/guide/controller
// You can include any angular dependencies as parameters for this function
// TIP: Access Route Parameters for your page via $stateParams.parameterName
function ($scope, $stateParams, $state, authService) {
    authService.checkLogin();
    $scope.user = {};
    window.onkeyup = function(e) {
       var key = e.keyCode ? e.keyCode : e.which;

       if (key == 13) {
           $scope.login($scope.user);
       }
    }
    $scope.login = function(user){
        //console.log(user);
        authService.login(user);
    }
}])

.controller('registerCtrl', ['$scope', '$stateParams', '$state', 'authService', // The following is the constructor function for this page's controller. See https://docs.angularjs.org/guide/controller
// You can include any angular dependencies as parameters for this function
// TIP: Access Route Parameters for your page via $stateParams.parameterName
function ($scope, $stateParams, $state, authService){
    $scope.user = {};
    window.onkeyup = function(e) {
       var key = e.keyCode ? e.keyCode : e.which;

       if (key == 13) {
           $scope.register($scope.user);
       }
    }
    $scope.register = function(user){
        //console.log(user);
        authService.createUser(user);
    }
}])

.controller('settingsCtrl', ['$scope', '$stateParams', '$state', 'authService', '$firebaseArray', '$firebaseAuth', '$ionicLoading', // The following is the constructor function for this page's controller. See https://docs.angularjs.org/guide/controller
// You can include any angular dependencies as parameters for this function
// TIP: Access Route Parameters for your page via $stateParams.parameterName
function ($scope, $stateParams, $state, authService, $firebaseArray, $firebaseAuth, $ionicLoading){
    $scope.data = {};

    window.onkeyup = function(e) {
       var key = e.keyCode ? e.keyCode : e.which;

       if (key == 13) {
           $scope.update($scope.data);
       }
    }

    $scope.update = function(data){
        if(!data.phone && !data.name){
            return;
        }
        $ionicLoading.show({
            template: '<p>Updating...</p></br><ion-spinner class="spinner-energized" icon="lines"></ion-spinner>'
        });
        var userInfo = $firebaseAuth().$getAuth();
        if(data.name){
            firebase.database().ref('users/'+userInfo.uid+'/displayName').set(data.name);
            if(data.phone){
                firebase.database().ref('users/'+userInfo.uid+'/phone').set(data.phone);
            }
            userInfo.updateProfile({
                displayName: data.name
            }).then(function() {
                $ionicLoading.hide();
            }, function(error) {
                console.log(error);
            });
        }
        else if(data.phone) {
            firebase.database().ref('users/'+userInfo.uid+'/phone').set(data.phone);
            $ionicLoading.hide();
        }
        $scope.data = {};
    }

    //console.log("Settings");
    if(authService.getUser().photo){
        $scope.userPhotoURL = authService.getUser().photo;
    }else{
        $scope.userPhotoURL = "img/default.png";
    }

    $scope.fileChanged = function(){
       //angular.element('#fileUplaod').trigger('click');
       document.getElementById('fileUplaod').click();
    };
    $scope.profilePictureSelected = function(data){
        //console.log(data.files[0]);
        // Create a Storage Ref w/ username
        var storageRef = firebase.storage().ref(authService.getUser().uid + '/profilePicture/' + data.files[0].name);
        // Upload file
        var task = storageRef.put(data.files[0]);
        task.on('state_changed', function(snapshot){
            // Observe state change events such as progress, pause, and resume
            // Get task progress, including the number of bytes uploaded and the total number of bytes to be uploaded
            var progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            $ionicLoading.show({
                template: '<p>Updating...</p></br><ion-spinner class="spinner-energized" icon="lines"></ion-spinner>'
            });
            //console.log('Upload is ' + progress + '% done');
        }, function(error) {
            // Handle unsuccessful uploads
            alert(`Error(${error.code}): ${error.message}`);
        }, function() {
            // On Success
            $ionicLoading.hide();
            //console.log(snapshot.downloadURL);
            authService.setUserInfo(task.snapshot.downloadURL, -1, -1);
            $scope.userPhotoURL = task.snapshot.downloadURL;
            var userInfo = $firebaseAuth().$getAuth();
            userInfo.updateProfile({
                photoURL: task.snapshot.downloadURL,
            }).then(function() {
                //console.log('user added');
            }, function(error) {
                console.log(error);
            });
            firebase.database().ref('users/'+userInfo.uid+'/photoURL').set(task.snapshot.downloadURL);
        });
    };
}])

.controller('landingCtrl', ['$scope', '$stateParams', '$timeout', '$state', // The following is the constructor function for this page's controller. See https://docs.angularjs.org/guide/controller
// You can include any angular dependencies as parameters for this function
// TIP: Access Route Parameters for your page via $stateParams.parameterName
function ($scope, $stateParams, $timeout, $state) {
    $timeout(function () {
        $state.go('login');
    }, 2000);
}])
