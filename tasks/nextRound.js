/*

This task exports a spreadsheet that can be used to set up the next round in
Google sheets. It should be run using the `close` meta-task:

```
grunt close --round=round_id
```

We'll use this option command syntax for symmetricality with the `open` task.

*/

var shell = require("shelljs");

module.exports = function(grunt) {

  var getSheet = function(id) { return grunt.data.json[id] };

  grunt.registerTask("advance", function() {

    var done = this.async();

    grunt.task.requires("content");

    var roundID = grunt.option("round");

    var sheet = getSheet(roundID);

    var next = [];

    for (var i = 0; i < sheet.length; i += 2) {
      var a = sheet[i];
      var b = sheet[i + 1];

      next.push({ 
        id: a.votes * 1 > b.votes * 1 ? a.id : b.id,
        votes: 0
      });
    }

    var keys = Object.keys(next[0]);
    var buffer = [keys.join(",")];
    next.forEach(function(row) {
      var line = [];
      keys.forEach(function(k) { line.push(row[k]) });
      buffer.push(line.join(","));
    });

    buffer = buffer.join("\n");
    

    grunt.file.write("next-round.csv", buffer);

    shell.exec((process.platform == "win32" ? "start " : "open ") + "next-round.csv", function() {
      grunt.log.oklns("Closing " + roundID + ", opening spreadsheet with new round. Paste this into the next round's Google Sheet.");
      done();
    });

  });

}