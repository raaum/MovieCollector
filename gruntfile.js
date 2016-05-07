module.exports  = function(grunt) {

  grunt.initConfig({
    browserify:     {
      options:      {
        transform:  [ require('grunt-react').browserify ]
      },
      app:          {
        src:        './src/app.js',
        dest:       './js/appbundle.js'
      }
    },
    watch   : {
      def : {
        files : ['./src/**/*.js', './src/**/*.jsx'],
        tasks : ['browserify','watch']
      },
    }
  });

  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-browserify');
  grunt.registerTask('default', ['browserify', 'watch']);
}
