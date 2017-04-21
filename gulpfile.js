var browserSync = require("browser-sync");
var browserify = require("browserify");
var gulp = require("gulp");
var uglify = require("gulp-uglify");
var uglifycss = require("gulp-uglifycss");
var gutil = require("gulp-util");
var buffer = require("vinyl-buffer");
var source = require("vinyl-source-stream");
var reload = browserSync.reload;

gulp.task("browserify", function () {
    var bundler = browserify("src/bing-geocodifier.js", {
        debug: true
    });

    return bundler.bundle()
        .pipe(source("bing-geocodifier.js"))
        .pipe(gulp.dest('./build/'));
});

gulp.task("browserify:prod", function () {
    var bundler = browserify("src/bing-geocodifier.js", {
        debug: true
    });

    return bundler.bundle()
        .pipe(source("bing-geocodifier.min.js"))
        .pipe(buffer())
        .pipe(uglify().on("error", gutil.log))
        .pipe(gulp.dest('./build/'));
});

gulp.task("build-css", function() {
    return gulp.src("src/bing-geocodifier.css")
            .pipe(gulp.dest('./build/'));
});

gulp.task("build-css:prod", function() {
    return gulp.src("src/bing-geocodifier.css")
            .pipe(uglifycss({
              "maxLineLen": 80,
              "uglyComments": true
            }))
            .pipe(gulp.dest('./build/'));
});

gulp.task("build", ["browserify:prod", "build-css:prod"]);

gulp.task("browser-sync", ["watch"], function () {
    browserSync({
        server: { baseDir: "./" },
        open: false
    });
});

gulp.task("watch", ["browserify"], function(done) {
    gulp.watch('src/bing-geocodifier.js', ["browserify"]);
    gulp.watch('src/bing-geocodifier.css', ["build-css"]);
    done();
});


gulp.task("default", [], function () {
    gulp.start("browser-sync");
});