module.exports = function(grunt) {
    grunt.initConfig({
        browserify2: {
            compile: {
                entry: './lib/cem.js',
                compile: './dist/cem.js'
            }
        },
        uglify: {
            compress: {
                files: {
                    './dist/cem.min.js': ['./dist/cem.js']
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-browserify2');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.registerTask('default', ['browserify2:compile', 'uglify:compress']);
};