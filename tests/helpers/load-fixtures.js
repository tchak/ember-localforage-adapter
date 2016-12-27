import Ember from 'ember';
import { storage } from 'ember-offline-adapter';

export default async function(fixtures, namespace = null) {
  let _storage = storage(namespace);

  await Ember.run(async function() {
    for (let key in fixtures) {
      await _storage.setItem(key, fixtures[key]);
    }
  });
}
