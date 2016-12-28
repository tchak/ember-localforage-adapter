import Ember from 'ember';
import { moduleFor, test } from 'ember-qunit';
import FIXTURES from '../helpers/fixtures/crud';
import { clone } from 'ember-offline-adapter';

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

  let data = post._createSnapshot().dump();

  assert.deepEqual(data, Object.assign({
    meta: { ts: data.meta.ts }
  }, FIXTURES.post.p1));

  assert.equal(list.get('day'), 1);
  data = list._createSnapshot().dump();
  assert.equal(data.attributes.day, 24);

  assert.deepEqual(data, Object.assign({
    meta: { ts: data.meta.ts }
  }, FIXTURES.list.l1));
});
