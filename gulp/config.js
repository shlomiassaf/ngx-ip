const path = require('path');

// package.json as JS object
module.exports.pkg = require(path.join(__dirname, '../package.json'));

// note: for all paths, the base dir is ../
module.exports.PATHS = {
  releaseAssets: ['LICENSE', 'README.md'],
  tmp: '.tmp/',
  dist: {
    base: 'release/',
    esm: 'release/esm/',
    bundles: 'release/bundles/',
  }
};

module.exports.banner = ['/**',
  ' * <%= pkg.name %> - <%= pkg.description %>',
  ' * @version v<%= pkg.version %>',
  ' * @link <%= pkg.homepage %>',
  ' * @license <%= pkg.license %>',
  ' */',
  ''].join('\n');
