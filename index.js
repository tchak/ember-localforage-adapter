/* jshint node: true */
'use strict';

module.exports = {
  name: 'ember-localforage-adapter',

  options: {
    nodeAssets: {
      localforage: {
        import: [{
          path: 'dist/localforage.js',
          using: [{ transformation: 'amd', as: 'localforage' }]
        }]
      },
      'node-uuid': {
        import: [{
          path: 'uuid.js',
          using: [{ transformation: 'amd', as: 'uuid' }]
        }]
      }
    }
  }
};
