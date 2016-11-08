export default {
  entry: 'release/esm/index.js',
  dest: 'release/bundle/ng2ip.umd.js',
  format: 'umd',
  moduleName: 'ng2ip',
  sourceMap: true,
  globals: {
    '@angular/core': 'ng.core',
    '@angular/common': 'ng.common',
    '@angular/forms': 'ng.forms',
    '@angular/compiler': 'ng.compiler',
    '@angular/platform-browser': 'ng.platformBrowser',
    '@angular/platform-browser-dynamic': 'ng.platformBrowserDynamic'
  }
}
