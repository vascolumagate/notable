'use strict';

var gulp = require('gulp');
var jetpack = require('fs-jetpack');
var bundle = require('./bundle');
var istanbul = require('rollup-plugin-istanbul');
var runsequence = require('run-sequence');
var ts = require('gulp-typescript');


var projectDir = jetpack;
var srcDir = jetpack.cwd('./src');
var distDir = jetpack.cwd('./dist');
var destDir = jetpack.cwd('./app');

var tsProject = ts.createProject('tsconfig.json');

// Spec files are scattered through the whole project. Here we're searching
// for them and generate one entry file which will run all the tests.
var generateEntryFile = function (dir, destFileName, filePattern) {
    var fileBanner = "// This file is generated automatically.\n"
        + "// All modifications will be lost.\n";

    return dir.findAsync('.', { matching: filePattern })
    .then(function (specPaths) {
        var fileContent = specPaths.map(function (path) {
            return 'import "./' + path.replace(/\\/g, '/') + '";';
        }).join('\n');
        console.log(destFileName);
        return dir.writeAsync(destFileName, fileBanner + fileContent);
    })
    .then(function () {
        return dir.path(destFileName);
    });
};

gulp.task('build-unit', ['environment'], function () {
    return generateEntryFile(distDir, 'specs.js.autogenerated', '*.spec.js')
    .then(function (entryFilePath) {
        return bundle(entryFilePath, destDir.path('specs.js.autogenerated'), {
            rollupPlugins: [
                istanbul({
                    exclude: ['**/*.spec.js', '**/specs.js.autogenerated'],
                    sourceMap: true
                })
            ]
        });
    });
});

gulp.task('build-e2e', ['build'], function () {
    var srcDir = jetpack.cwd('e2e');
    var destDir = jetpack.cwd('app');

    return generateEntryFile(srcDir, 'e2e.js.autogenerated', '*.e2e.js')
    .then(function (entryFilePath) {
        return bundle(entryFilePath, destDir.path('e2e.js.autogenerated'));
    });
});

gulp.task('test', runsequence('ts', 'build-unit', 'bundle'));