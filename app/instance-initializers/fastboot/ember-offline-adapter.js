import { toJSON } from 'ember-offline-adapter/-private/snapshot';
import { STORE_NAME } from 'ember-offline-adapter/localforage';

export function initialize(instance) {
  let store = instance.lookup('service:store');
  let fastboot = instance.lookup('service:fastboot');

  if (fastboot) {
    fastboot.get('shoebox').put(STORE_NAME, {
      get cache() {
        return Object.keys(store.typeMaps).map(k => {
          let { modelName } = store.typeMaps[k].type;
          return [modelName, peekAll(store, modelName)];
        }).reduce((hash, [modelName, records]) => {
          hash[modelName] = records.reduce((hash, record) => {
            let snapshot = record._createSnapshot();
            hash[snapshot.id] = toJSON(snapshot);
            return hash;
          }, {});
          return hash;
        }, {});
      }
    });
  }
}

function peekAll(store, modelName) {
  return store.peekAll(modelName).toArray()
    .filter(record => !(record.get('isDeleted') || record.get('isNew')));
}

export default {
  name: 'ember-offline-adapter',
  initialize
};
