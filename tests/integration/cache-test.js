import Ember from 'ember';
import { moduleFor, test } from 'ember-qunit';
import FIXTURES from '../helpers/fixtures/crud';
import loadFixtures from '../helpers/load-fixtures';
import { offLine } from '../helpers/on-line';

var store;
var adapter;

const { run, get } = Ember;
const proto = Object.prototype;
const gpo = Object.getPrototypeOf;

moduleFor('service:store', "Cache", {
  integration: true,

  async beforeEach() {
    offLine();
    store = this.subject();
    adapter = store.adapterFor('default');

    await adapter.clearAll();
    await loadFixtures(FIXTURES);
  }
});

/**
 * @credits https://github.com/nickb1080/is-pojo
 * @param obj
 * @returns {boolean}
 */
function isPojo(obj) {
  if (obj === null || typeof obj !== "object") {
    return false;
  }
  return gpo(obj) === proto;
}

test("cache should be unbound data", async function(assert) {
  assert.expect(13);

  let records = await run(() => store.findAll('list'));
  let listCache;
  let firstRecord = records.objectAt(0);
  let secondRecord = records.objectAt(1);
  let thirdRecord = records.objectAt(2);

  assert.equal(get(records, 'length'), 3, "3 items were found");

  assert.equal(get(firstRecord, 'name'), "one", "First item's name is one");
  assert.equal(get(secondRecord, 'name'), "two", "Second item's name is two");
  assert.equal(get(thirdRecord, 'name'), "three", "Third item's name is three");

  assert.equal(get(firstRecord, 'day'), 1, "First item's day is 1");
  assert.equal(get(secondRecord, 'day'), 2, "Second item's day is 2");
  assert.equal(get(thirdRecord, 'day'), 3, "Third item's day is 3");

  listCache = adapter.get('cache').get('list');
  assert.equal(isPojo(listCache), true, 'should have cache');
  assert.equal(listCache[get(firstRecord, 'id')].attributes.name, 'one');

  run(() => firstRecord.set('name', 'two'));

  listCache = adapter.get('cache').get('list');
  assert.equal(isPojo(listCache), true);
  assert.equal(listCache[get(firstRecord, 'id')].attributes.name, 'one');

  await run(() => firstRecord.save());

  listCache = adapter.get('cache').get('list');
  assert.equal(isPojo(listCache), true);
  assert.equal(listCache[get(firstRecord, 'id')].attributes.name, 'two');
});
