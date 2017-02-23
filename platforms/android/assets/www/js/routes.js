angular.module('app.routes', [])

.config(function($stateProvider, $urlRouterProvider) {

  // Ionic uses AngularUI Router which uses the concept of states
  // Learn more here: https://github.com/angular-ui/ui-router
  // Set up the various states which the app can be in.
  // Each state's controller can be found in controllers.js
  $stateProvider



      .state('tabsController.contest', {
    url: '/contest',
    views: {
      'tab1': {
        templateUrl: 'templates/contest.html',
        controller: 'contestCtrl'
      }
    }
  })

  .state('tabsController.predictions', {
    url: '/predictions',
    views: {
      'tab2': {
        templateUrl: 'templates/predictions.html',
        controller: 'predictionsCtrl'
      }
    }
  })

  .state('settings', {
        url: '/settings',
        templateUrl: 'templates/settings.html',
        controller: 'settingsCtrl'
  })

  .state('tabsController.leaderboard', {
    url: '/leaderboard',
    views: {
      'tab3': {
        templateUrl: 'templates/leaderboard.html',
        controller: 'leaderboardCtrl'
      }
    }
  })

    .state('tabsController.manager', {
        url: '/manager',
        views: {
          'tab5': {
            templateUrl: 'templates/manager.html',
            controller: 'managerCtrl'
          }
        }
    })

  .state('tabsController', {
    url: '/page1',
    templateUrl: 'templates/tabsController.html',
    controller: 'generalCtrl',
    abstract:true
  })

  .state('login', {
    url: '/login',
    templateUrl: 'templates/login.html',
    controller: 'loginCtrl'
  })

  .state('register', {
    url: '/register',
    templateUrl: 'templates/register.html',
    controller: 'registerCtrl'
  })

  .state('landing', {
    cache: false,
    url: '/landing',
    templateUrl: 'templates/landing.html',
    controller: 'landingCtrl'
  })

$urlRouterProvider.otherwise('/landing')



});
