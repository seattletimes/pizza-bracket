/*

This task sets up the grunt.data properties needed to correctly generate a
round. You should run it using the `open` meta-task:

```
grunt open --round=round_id
```

By using the CLI options, instead of a target (as we do with `publish`), we
can make this the default task, and it'll be preserved across `watch` runs.

*/

module.exports = function(grunt) {

  var getSheet = function(id) { return grunt.data.json[id] };

  grunt.registerTask("matchups", function() {

    //load up candidate metadata
    var candidates = getSheet("candidates");
    var bracketClosed = grunt.option("closed");

    var processRound = function(sheet, isPast) {
      var round = { matchups: [] };
      //future rounds
      if (!sheet) return round;

      for (var i = 0; i < sheet.length; i += 2) {
        var a = sheet[i];
        var b = sheet[i + 1];
        a.votes *= 1;
        b.votes *= 1;
        var matchup = {
          options: [a, b],
          total: a.votes + b.votes,
          winner: null
        };
        matchup.options.forEach(function(option) {
          option.details = candidates[option.id];
        });
        if (isPast || bracketClosed) {
          matchup.winner = a.votes > b.votes ? a.id : b.id
        }
        round.matchups.push(matchup);
      }
      round.current = !isPast;
      return round;
    };

    var orderSheet = getSheet("order");

    if (!orderSheet) {
      grunt.fail.fatal("Unable to load the config sheet with order data -- have you run `grunt sheets`?");
    }

    var roundID = grunt.option("round");

    if (!roundID) {
      grunt.log.errorlns("You didn't specify a round, defaulting to the first in config sheet (\"" + orderSheet[0].sheet + "\"). Use --round=round_id to avoid this error.");
      roundID = orderSheet[0].sheet;
    }

    if (!getSheet(roundID)) {
      grunt.fail.fatal("Sheet for the specified round doesn't exist -- do you need to re-run `grunt sheets`?");
    }

    //technically, we don't need order, but I dislike assuming object key order is reliable
    var bracket = {
      rounds: [],
      current: roundID
    };

    //first handle sheets up to the current round
    for (var i = 0; i < orderSheet.length; i++) {
      var order = orderSheet[i];
      var sheet = getSheet(order.sheet);
      var isCurrent = order.sheet == roundID;
      var data = processRound(sheet, !isCurrent);
      data.title = order.title;
      data.description = order.description;
      data.id = order.sheet;
      bracket.rounds.push(data);
      // if (data.current) break;
    }

    bracket.closed = bracketClosed;
    grunt.data.bracket = bracket;

  });

};