angular.module('app.services', ['firebase'])

.factory('authService', ['$state', '$firebaseAuth', '$ionicPopup', function ($state, $firebaseAuth, $ionicPopup){
    var firebaseAuth = $firebaseAuth();
    var logged = false;
    var currUser = {};
    var authService = {};

    function updateUserInfo(){
        firebase.auth().onAuthStateChanged(function(userInfo) {
            if (userInfo){
                firebase.database().ref('users/'+userInfo.uid).on('child_changed',function(snap){
                    currUser.username       = userInfo.displayName;
                    currUser.email          = userInfo.email;
                    currUser.uid            = userInfo.uid;
                    if(userInfo.photoURL){ currUser.photo = userInfo.photoURL; }
                    else { currUser.photo      = "img/default.png"; }
                    currUser.points         = snap.val().points;
                    currUser.predictions    = snap.val().predictions;
                    console.log("Updating");
                });
            }
        });
    }
    authService.forceUpdate = function(){
        updateUserInfo();
    }
    authService.setUserInfo = function(photo, name, email){
        if(photo != -1){
            currUser.photo = photo;
            console.log(currUser.photo);
        }
        if(name != -1){
            currUser.username = name;
        }
        if(email != -1){
            currUser.email = email;
        }
    }
    authService.getUser = function(){
        //console.log(currUser);
        return currUser;
    }
    authService.checkLogin = function(){
        firebase.auth().onAuthStateChanged(function(userInfo) {
            if (userInfo){
                firebase.database().ref('users/'+userInfo.uid).once('value',function(snap){
                    currUser.username       = userInfo.displayName;
                    currUser.email          = userInfo.email;
                    currUser.uid            = userInfo.uid;
                    if(userInfo.photoURL){ currUser.photo = userInfo.photoURL; }
                    else { currUser.photo      = "img/default.png"; }
                    currUser.points         = snap.val().points;
                    currUser.predictions    = snap.val().predictions;
                    console.log(currUser);
                    $state.go('tabsController.contest');
                });
            }
        });
    }
    authService.login = function(user){
        firebaseAuth.$signInWithEmailAndPassword(user.email, user.password).then(function(userInfo){
            // If no error
            logged = true;
            firebase.database().ref('users/'+userInfo.uid).once('value',function(snap){
                currUser.username       = userInfo.displayName;
                currUser.photo          = userInfo.photoURL;
                currUser.email          = userInfo.email;
                currUser.uid            = userInfo.uid;
                currUser.predictions    = snap.val().predictions;
                currUser.points         = snap.val().points;
                $state.go('tabsController.contest');
            });
        }).catch(function(error){
            console.log(`Error(${error.code}): ${error.message}`);
            if(error.code == "auth/user-not-found"){
                var alertPopup = $ionicPopup.alert({
                    title: 'ERROR',
                    template: 'The user does not exist.'
                });
            }
        });
    }
    authService.createUser = function(user){
        if(user.username != null && user.email != null && user.password != null){
            firebaseAuth.$createUserWithEmailAndPassword(user.email, user.password).then(function(){
                var userInfo = firebaseAuth.$getAuth();
                firebase.database().ref('users/'+userInfo.uid+'/predictions').set(false);
                firebase.database().ref('users/'+userInfo.uid+'/points').set(0);
                firebase.database().ref('users/'+userInfo.uid+'/displayName').set(user.username);
                firebase.database().ref('users/'+userInfo.uid+'/photoURL').set("img/default.png");

                userInfo.updateProfile({
                    displayName: user.username,
                }).then(function() {
                    //console.log('user added');
                }, function(error) {
                    console.log(error);
                });
            }).catch(function(error){
                alert(`Error(${error.code}): ${error.message}`);
            });

            $state.go('login');
        }else{
            alert("Please make sure to fill out all fields.");
        }
    }
    authService.resetPassword = function(email){
        if(email != null){
            var emailAddress = email;
            firebaseAuth.$sendPasswordResetEmail(emailAddress).then(function() {
                alert("Email sent...");
            }, function(error) {
                alert(error);
            });
        }
        else{
            alert("Please make sure to enter an Email Address.");
        }
    }
    authService.logout = function(){
		firebase.auth().signOut().then(function() {
			alert("Successfully logged out.");
  			$state.go('landing');
		}, function(error) {
			console.log("An error occurred while logging out");
		});
    }

    return authService;
}])

.factory('globals', ['$state', '$firebaseAuth', '$ionicPopup', function ($state, $firebaseAuth, $ionicPopup){
    var categories = [];
    var globalService = {};
    var eventStarted = false;

    globalService.getcategories = function(){
        return categories;
    }
    globalService.setcategories = function(){
        //set categories from db here
    }
    globalService.setEventStart = function(ifStarted){
        eventStarted = ifStarted;
    }
    globalService.getEventStart = function(){
        return eventStarted;
    }

    return globalService;
}]);
