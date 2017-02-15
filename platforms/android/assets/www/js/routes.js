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

  .state('tabsController.leaderboard', {
    url: '/leaderboard',
    views: {
      'tab3': {
        templateUrl: 'templates/leaderboard.html',
        controller: 'leaderboardCtrl'
      }
    }
  })

  .state('tabsController', {
    url: '/page1',
    templateUrl: 'templates/tabsController.html',
    abstract:true
  })

  .state('landing', {
    url: '/landing',
    templateUrl: 'templates/landing.html',
    controller: 'landingCtrl'
  })

$urlRouterProvider.otherwise('/page1/contest')



});