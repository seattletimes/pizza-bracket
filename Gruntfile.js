module.exports = function(grunt) {

  //load tasks
  grunt.loadTasks("./tasks");

  grunt.registerTask("content", "Load content from data files", ["state", "json", "csv", "markdown"]);
  grunt.registerTask("template", "Build HTML from content/templates", ["content", "matchups", "build"]);
  grunt.registerTask("aux", "Build non-HTML content", ["copy", "bundle", "less"]);
  grunt.registerTask("static", "Build all files", ["aux", "template"]);
  
  //project-specific meta-tasks
  grunt.registerTask("close", "Generate spreadsheet for next round", ["content", "matchups", "advance"]);

  grunt.registerTask("default", ["clean", "static", "connect:dev", "watch"]);

};
