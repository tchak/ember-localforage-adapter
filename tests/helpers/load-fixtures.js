import Ember from 'ember';
import localforage from 'localforage';

const STORE_NAME = 'ember-offline-store';

export default async function(fixtures, namespace = null) {
  let storeName = namespace ? `${STORE_NAME}-${namespace}` : STORE_NAME;
  let storage = localforage.createInstance({ storeName });

  await Ember.run(async function() {
    for (let key in fixtures) {
      await storage.setItem(key, fixtures[key]);
    }
  });
}
