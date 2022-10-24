"use strict";

const gulp = require("gulp");
const rename = require("gulp-rename");
const pug = require("gulp-pug");
const beautify = require("gulp-beautify");
const sass = require("gulp-sass");
const cssmin = require("gulp-clean-css");
const imageMin = require("gulp-imagemin");
const webp = require("gulp-webp");
const bs = require("browser-sync").create();

const { src, dest, watch, series, parallel } = gulp;

module.exports.default = series(html, css, js, imgmin, parallel(watchFiles, browserSync));
module.exports.img = imgmin;

const SRC_GLOBS = {
    pug:        "./src/pug/*.pug",
    pugAll:     "./src/pug/**/*.pug",
    scssIndex:  "./src/scss/index.scss",
    scss:       "./src/scss/*.scss",
    js:         "./src/js/*.js",
    img:        "./src/img/*.*",
};

function html() {
    return src(SRC_GLOBS.pug)
        .pipe( pug() )
        .pipe( beautify.html({ indent_size: 4 }) )
        .pipe( dest("./build/") );
}

function css() {
    return src(SRC_GLOBS.scssIndex)
        .pipe( sass() )
        // .pipe( cssmin() )
        .pipe( rename({
            basename: "style",
            suffix: ".min",
        }) )
        .pipe( dest("./build/css/") );
}

function js() {
    return src(SRC_GLOBS.js)
        .pipe( rename({
            suffix: ".min",
        }) )
        .pipe( dest("./build/js/") );
}

function imgmin() {
    const imgDest = "./build/img/";

    src(SRC_GLOBS.img)
        .pipe( imageMin([
            imageMin.mozjpeg({quality: 80, progressive: true}),
        ]) )
        .pipe( dest(imgDest) );

    return src(SRC_GLOBS.img)
        .pipe( webp() )
        .pipe( dest(imgDest) );
}

function watchFiles() {
    watch(SRC_GLOBS.pugAll, html);
    watch(SRC_GLOBS.scss, css);
    watch(SRC_GLOBS.js, js);
    watch(SRC_GLOBS.img, imgmin);
}

function browserSync() {
    bs.init({
        watch: true,
        server: {
            baseDir: "build",
            index: "index.html"
        },
        ghostMode: false,
        notify: false,
        ui: false,
    });
}