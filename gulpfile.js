'use strict';

var gulp = require('gulp');
var plugins = require('gulp-load-plugins')();

var DEST = '.';
var file = 'angular-auto-complete.js';

gulp.task('scripts', function () {
    return gulp.src(file)
        .pipe(plugins.eslint())
        .pipe(plugins.eslint.format());
    //.pipe(plugins.uglify())
    //.pipe(plugins.rename({ extname: '.min.js' }))
    //.pipe(gulp.dest(DEST));
});

gulp.task('documentation', function () {
    return gulp.src(file)
        .pipe(plugins.documentation('json', { filename: 'docs.json' }))
        .pipe(gulp.dest(DEST));
});

gulp.task('default', ['scripts', 'documentation']);

gulp.task('watch', function () {
    gulp.watch(file, ['default']);
});
