import serialize from 'ember-offline-adapter/serialize-store';
import { STORE_NAME } from 'ember-offline-adapter/localforage';

export function initialize(instance) {
  let store = instance.lookup('service:store');
  let fastboot = instance.lookup('service:fastboot');

  if (fastboot) {
    fastboot.get('shoebox').put(STORE_NAME, {
      get cache() {
        return serialize(store);
      }
    });
  }
}

export default {
  name: 'ember-offline-adapter',
  initialize
};
