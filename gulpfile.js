'use strict';

var gulp = require('gulp');
var plugins = require('gulp-load-plugins')();
var stylish = require('jshint-stylish');

gulp.task('scripts', function () {
    return gulp.src(
        [
            'scripts/angular-auto-complete.js',
            'scripts/app.js'
        ])
        .pipe(plugins.jshint({camelcase: true, unused: 'strict'}))
        .pipe(plugins.jshint.reporter(stylish))
        //.pipe(plugins.uglify())
        //.pipe(plugins.rename({extname: '.min.js'}))
        .pipe(gulp.dest('./dist'));
});

// Rerun the task when a file changes
gulp.task('watch', function () {
    gulp.watch([
        'scripts/angular-auto-complete.js',
        'scripts/app.js'
    ], ['scripts']);
});

gulp.task('default', ['scripts', 'watch']);
