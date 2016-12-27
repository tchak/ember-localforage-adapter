import Ember from 'ember';
import { moduleFor, test } from 'ember-qunit';
import FIXTURES from '../helpers/fixtures/crud';
import serialize from 'ember-offline-adapter/serialize-snapshot';
import { clone } from 'ember-offline-adapter/-utils';

var store;

const { run } = Ember;

moduleFor('service:store', "Snapshot", {
  integration: true,

  async beforeEach() {
    store = this.subject();
  }
});

test('toJSON', async function(assert) {
  run(() => {
    store.pushPayload({ data: clone(FIXTURES.post.p1) });
    store.pushPayload({ data: clone(FIXTURES.list.l1) });
  });

  let list = await store.findRecord('list', 'l1');
  let post = await store.findRecord('post', 'p1');

  let snapshot = post._createSnapshot();
  let data = serialize(snapshot);

  assert.deepEqual(data, FIXTURES.post.p1);

  assert.equal(list.get('day'), 1);
  snapshot = list._createSnapshot();
  data = serialize(snapshot);
  assert.equal(data.attributes.day, 24);

  assert.deepEqual(data, FIXTURES.list.l1);
});
