const gulp = require('gulp');
const del = require('del');
require('require-dir')('./gulp');
const config = require('./gulp/config');
const runSequence = require('run-sequence');

gulp.task('release', (done) => {
  runSequence(
    ['clean:dist', 'clean:tmp'],
    ['copyReleaseAssets', 'bundle'],
    ['createPackageJson'],
    done
  );
});
