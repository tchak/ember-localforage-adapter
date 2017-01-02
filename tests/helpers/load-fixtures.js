import Ember from 'ember';
import localforage from 'ember-offline-adapter/localforage';

export default async function(fixtures, namespace = null) {
  let storage = localforage({ name: namespace });

  await Ember.run(async function() {
    for (let key in fixtures) {
      await storage.setItem(key, fixtures[key]);
    }
  });
}
