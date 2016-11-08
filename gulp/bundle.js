const gulp = require('gulp');
const fs = require('fs');
const path = require('path');
const config = require('./config');
const shell = require('gulp-shell');

const ROLLUP_CONFIG = 'rollup.config.js';

const filename = `ng2-ip.umd.js`;
const tsCommand = `./node_modules/.bin/tsc --out ${path.join(config.PATHS.dist.bundles, filename)} --target es5 --allowJs ${path.join(config.PATHS.tmp, filename)}`;
const rollupCommand = `./node_modules/.bin/rollup -c ${ROLLUP_CONFIG}`;

gulp.task('rollup:umd', ['scripts'], shell.task(rollupCommand));

gulp.task('bundle:umd', ['rollup:umd'], shell.task(tsCommand, { ignoreErrors: true }));

gulp.task('bundle:umd:min', ['bundle:umd'], (done) => {
  done();
});

gulp.task('bundle', ['bundle:umd', 'bundle:umd:min']);

