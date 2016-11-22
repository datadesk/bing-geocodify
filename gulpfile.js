var browserSync = require("browser-sync");
var reload = browserSync.reload;
var browserify = require("browserify");
var gulp = require("gulp");
var source = require("vinyl-source-stream");

gulp.task("browserify", function () {
    var bundler = browserify("src/bing-geocodifier.js", {
        debug: true
    });

    return bundler.bundle()
        .pipe(source("bing-geocodifier.js"))
        .pipe(gulp.dest('./build/'));
});

gulp.task("build-css", function() {
    return gulp.src("src/bing-geocodifier.css")
            //.pipe(source("bing-geocodifier.css"))
            .pipe(gulp.dest('./build/'));
});

gulp.task("browser-sync", ["watch"], function () {
    browserSync({
        server: { baseDir: "build" },
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