require("./lib/social");
require("./lib/ads");
var track = require("./lib/tracking");

var memory = require("./memory");
memory.configure(window.config.page, window.bracket.current);
var Tabletop = require("tabletop");

var app = require("./application");

var controller = function($scope, $http) {
  $scope.bracket = window.bracket;

  var current = $scope.round = window.bracket.rounds.filter(r => r.current).pop();
  memory.remember(votes => {
    current.matchups.forEach(function(match) {
      if (match.options.some(o => o.id in votes)) {
        match.voted = match.options[0].id in votes ? match.options[0].id : match.options[1].id;
      }
    });
    $scope.$apply();
  });

  // disable Tabletop updates during testing due to Google API limits
  Tabletop.init({
    key: window.config.sheet,
    simpleSheet: true,
    wanted: [window.bracket.current],
    callback: function(rows) {
      var voting = {};
      rows.forEach(function(row) {
        voting[row.id] = row.votes * 1;
      });
      current.matchups.forEach(function(match) {
        //first pass, recount the votes
        match.options.forEach(function(option) {
          if (voting[option.id]) {
            option.votes = voting[option.id];
          }
        });
        match.total = match.options[0].votes + match.options[1].votes;
      });
      $scope.$apply();
    }
  });

  $scope.vote = function(candidate, match) {
    var vote = candidate.id;
    candidate.voting = true;
    
    var request = $http.jsonp(window.config.endpoint, {
      params: { vote, callback: "JSON_CALLBACK" }
    });
    request.then(function(response) {
      candidate.voting = false;
      if (response.data.status == "success") {
        memory.flag(vote);
        match.voted = vote;
      }
    });
  };

  $scope.selectMatch = function(match, candidate) {
    $scope.selected = { match, candidate };
  };

  $scope.clearCandidate = function() {
    if ($scope.selected) $scope.selected.candidate = null;
  };

  $scope.selectMatch($scope.round.matchups[0], null);

  $scope.shiftRound = function(delta) {
    var before = $scope.round;
    var index = $scope.bracket.rounds.indexOf($scope.round);
    index += delta;
    if (index < 0) index = 0;
    if (index > $scope.bracket.rounds.length - 1) index = $scope.bracket.rounds.length - 1;
    $scope.round = $scope.bracket.rounds[index];
    if ($scope.round != before) {
      $scope.selected = {
        match: $scope.round.matchups[0]
      }
    }
  };

};
controller.$inject = ["$scope", "$http"];

app.controller("bracket-controller", controller);