import Ember from 'ember';
import { moduleFor, test } from 'ember-qunit';
import FIXTURES from '../helpers/fixtures/crud';
import { onLine } from '../helpers/on-line';
import FakeServer, { stubRequest } from 'ember-cli-fake-server';

var store;
var adapter;
const { run, get } = Ember;

moduleFor('service:store', "Ajax", {
  integration: true,

  async beforeEach() {
    onLine();
    store = this.subject();
    adapter = store.adapterFor('default');

    await adapter.clearAll();

    FakeServer.start();
  },

  afterEach() {
    FakeServer.stop();
  }
});

// Find methods
// -----------------------------------------------------------------------------

test("findAll", async function(assert) {
  assert.expect(10);

  stubRequest('GET', '/lists', (request) => {
    assert.ok('fetch from network once');
    request.ok({ data: Object.values(FIXTURES.list) });
  });

  let records = await run(() => store.findAll('list'));
  let firstRecord = records.objectAt(0);
  let secondRecord = records.objectAt(1);
  let thirdRecord = records.objectAt(2);

  assert.equal(get(records, 'length'), 3, "3 items were found");
  assert.equal(Object.keys(adapter.cache.get('list')).length, 3, "3 items were found in cache");

  assert.equal(get(firstRecord, 'name'), "one", "First item's name is one");
  assert.equal(get(secondRecord, 'name'), "two", "Second item's name is two");
  assert.equal(get(thirdRecord, 'name'), "three", "Third item's name is three");

  assert.equal(get(firstRecord, 'day'), 1, "First item's day is 1");
  assert.equal(get(secondRecord, 'day'), 2, "Second item's day is 2");
  assert.equal(get(thirdRecord, 'day'), 3, "Third item's day is 3");

  records = await run(() => store.findAll('list', { reload: true }));

  assert.equal(get(records, 'length'), 3, "3 items were found");
});

test("findRecord", async function(assert) {
  assert.expect(4);

  stubRequest('GET', '/lists/l1', (request) => {
    request.ok({ data: FIXTURES.list.l1 });
  });

  let list = await run(() => store.findRecord('list', 'l1'));

  assert.equal(get(list, 'id'), 'l1', "id is loaded correctly");
  assert.equal(get(list, 'name'), 'one', "name is loaded correctly");
  assert.equal(get(list, 'b'), true, "b is loaded correctly");
  assert.equal(get(list, 'day'), 1, "day is loaded correctly");
});
