angular.module('app.services', ['firebase'])

.factory('authService', ['$state', '$firebaseAuth', function ($state, $firebaseAuth){
    var firebaseAuth = $firebaseAuth();
    var logged = false;
    var currUser = {};
    var authService = {};

    authService.getUser = function(){
        return currUser;
    }
    authService.checkLogin = function(){
        firebase.auth().onAuthStateChanged(function(userInfo) {
            if (userInfo){
                currUser.username = userInfo.displayName;
                currUser.email    = userInfo.email;
                currUser.uid      = userInfo.uid;
                //console.log(currUser);
                $state.go('tabsController.contest');
            }
        });
    }
    authService.login = function(user){
        firebaseAuth.$signInWithEmailAndPassword(user.email, user.password).then(function(userInfo){
            // If no error
            logged = true;
            firebase.database().ref('users/'+userInfo.uid).on('value',function(snap){
                currUser.username       = userInfo.displayName;
                currUser.email          = userInfo.email;
                currUser.uid            = userInfo.uid;
                //console.log(currUser);
            });
            $state.go('tabsController.contest');
        }).catch(function(error){
            console.log(error.code + " - " + error.message);
        });
    }
    authService.createUser = function(user){
        if(user.username != null && user.email != null && user.password != null){
            firebaseAuth.$createUserWithEmailAndPassword(user.email, user.password).then(function(){
                var userInfo = firebaseAuth.$getAuth();
                firebase.database().ref('users/'+userInfo.uid+'/predictions').set('None');

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

.service('BlankService', [function(){

}]);
