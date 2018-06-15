export function initialize(instance) {
  let store = instance.lookup('service:store');
  let fastboot = instance.lookup('service:fastboot');

  if (fastboot) {
    fastboot.get('shoebox').put('ember-data-store', {
      get cache() {
        return store.dump();
      }
    });
  }
}

export default {
  name: 'ember-offline-adapter',
  initialize
};
