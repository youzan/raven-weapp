'use strict';

module.exports = function(grunt) {
  var path = require('path');
  var versionify = require('browserify-versionify');

  var browserifyConfig = {
    options: {
      browserifyOptions: {
        standalone: 'Raven' // umd
      },
      transform: [versionify]
    },
    core: {
      src: 'src/singleton.js',
      dest: 'build/raven.js'
    }
  };

  var gruntConfig = {
    pkg: grunt.file.readJSON('package.json'),

    clean: ['build'],

    browserify: browserifyConfig,

    uglify: {
      options: {
        sourceMap: true,

        // Only preserve comments that start with (!)
        preserveComments: /^!/,

        // Minify object properties that begin with _ ("private"
        // methods and values)
        mangleProperties: {
          regex: /^_/
        },

        compress: {
          booleans: true,
          conditionals: true,
          dead_code: true,
          join_vars: true,
          pure_getters: true,
          sequences: true,
          unused: true,

          global_defs: {
            __DEV__: false
          }
        }
      },
      dist: {
        src: ['build/**/*.js'],
        ext: '.min.js',
        expand: true
      }
    },

    release: {
      options: {
        npm: false,
        commitMessage: 'Release <%= version %>'
      }
    },

    sri: {
      build: {
        src: ['build/**/*.js'],
        options: {
          dest: 'build/sri.json',
          pretty: true
        }
      }
    }
  };

  grunt.initConfig(gruntConfig);

  // Custom Grunt tasks
  grunt.registerTask('version', function() {
    var pkg = grunt.config.get('pkg');

    // Verify version string in source code matches what's in package.json
    var Raven = require('./src/raven');
    if (Raven.prototype.VERSION !== pkg.version) {
      return grunt.util.error(
        'Mismatched version in src/raven.js: ' +
          Raven.prototype.VERSION +
          ' (should be ' +
          pkg.version +
          ')'
      );
    }

    if (grunt.option('dev')) {
      pkg.release = 'dev';
    } else {
      pkg.release = pkg.version;
    }
    grunt.config.set('pkg', pkg);
  });

  // Grunt contrib tasks
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-copy');

  // 3rd party Grunt tasks
  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-release');
  grunt.loadNpmTasks('grunt-gitinfo');
  grunt.loadNpmTasks('grunt-sri');

  // Build tasks
  grunt.registerTask('_prep', ['clean', 'gitinfo']);
  grunt.registerTask(
    'browserify.core',
    ['_prep', 'browserify:core']
  );

  grunt.registerTask('build.core', ['browserify.core', 'uglify']);

  grunt.registerTask('build', ['build.core']);
};
