import Ember from 'ember';
import { moduleFor, test } from 'ember-qunit';
import { uuid } from 'ember-offline-adapter/-utils';
import FIXTURES from '../helpers/fixtures/crud';
import MOCK_FIXTURES from '../helpers/fixtures/mock';
import loadFixtures from '../helpers/load-fixtures';
import { offLine } from '../helpers/on-line';

var store;
const { run, get } = Ember;

moduleFor('service:store', "CRUD", {
  integration: true,

  async beforeEach() {
    offLine();
    store = this.subject();

    //await adapter.clearAll();
    await loadFixtures(FIXTURES);
    await loadFixtures(MOCK_FIXTURES, 'MockAdapter');
  }
});

// Lifecycle methods
// -----------------------------------------------------------------------------

test("push", async function(assert) {
  assert.expect(3);

  let list = run(() => store.push({
    data: {
      type: 'list',
      id: uuid(),
      attributes: {
        name: 'Rambo'
      }
    }
  }));

  await run(() => list.save());
  let records = await run(() => store.query('list', { name: 'Rambo' }));
  let record = records.objectAt(0);

  assert.equal(get(records, 'length'), 1, "Only Rambo was found");
  assert.equal(get(record, 'name'), "Rambo", "Correct name");
  assert.equal(get(record, 'id'), list.id, "Correct, original id");
});

test("createRecord", async function(assert) {
  assert.expect(3);

  let list = run(() => store.createRecord('list', { name: 'Rambo' }));
  await run(() => list.save());

  let records = await store.query('list', { name: 'Rambo' });
  let record = records.objectAt(0);

  assert.equal(get(records, 'length'), 1, "Only Rambo was found");
  assert.equal(get(record, 'name'), "Rambo", "Correct name");
  assert.equal(get(record, 'id'), list.id, "Correct, original id");
});

test("updateRecord", async function(assert) {
  assert.expect(3);

  let list = run(() => store.createRecord('list', { name: 'Rambo' }));
  await run(() => list.save());

  let records = await store.query('list', { name: 'Rambo' });
  let record = records.objectAt(0);
  run(() => record.set('name', 'Macgyver'));
  await run(() => record.save());

  records = await store.query('list', { name: 'Macgyver' });
  record = records.objectAt(0);

  assert.equal(get(records, 'length'), 1, "Only one record was found");
  assert.equal(get(record, 'name'), "Macgyver", "Updated name shows up");
  assert.equal(get(record, 'id'), list.id, "Correct, original id");
});

test("destroyRecord", async function(assert) {
  assert.expect(2);

  let lists = await run(() => store.query('list', { name: 'one' }));
  let list = lists.objectAt(0);

  assert.equal(get(list, "id"), "l1", "Item exists");

  await run(() => list.destroyRecord());
  lists = await store.query('list', { name: 'one' });

  assert.equal(get(lists, 'length'), 0, "No record was found");
});

// Find methods
// -----------------------------------------------------------------------------

test("findAll", async function(assert) {
  assert.expect(7);

  let records = await run(() => store.findAll('list'));
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
});

test("findRecord", async function(assert) {
  assert.expect(4);

  let list = await run(() => store.findRecord('list', 'l1'));

  assert.equal(get(list, 'id'), 'l1', "id is loaded correctly");
  assert.equal(get(list, 'name'), 'one', "name is loaded correctly");
  assert.equal(get(list, 'b'), true, "b is loaded correctly");
  assert.equal(get(list, 'day'), 1, "day is loaded correctly");
});

// Query methods
// -----------------------------------------------------------------------------

test("query", async function(assert) {
  assert.expect(7);

  let records = await run(() => store.query('list', { name: /one|two/ }));
  assert.equal(get(records, 'length'), 2, "found results for /one|two/");

  records = await run(() => store.query('list', { name: /.+/, id: /l1/ }));
  assert.equal(get(records, 'length'), 1, "found results for { name: /.+/, id: /l1/ }");

  records = await run(() => store.query('list', { name: 'one' }));
  assert.equal(get(records, 'length'), 1, "found results for name 'one'");

  records = await run(() => store.query('list', { b: true }));
  assert.equal(get(records, 'length'), 1, "found results for { b: true }");

  records = await run(() => store.query('list', { name: 'two', b: false }));
  assert.equal(get(records, 'length'), 1, "found results for multiple criteria");

  records = await run(() => store.query('list', { name: 'four', b: false }));
  assert.equal(get(records, 'length'), 0, "found no results when only criteria matches");

  records = await run(() => store.query('list', { whatever: "dude" }));
  assert.equal(get(records, 'length'), 0, "didn't find results for nonsense");
});

test("queryRecord", async function(assert) {
  assert.expect(5);

  let list = await store.queryRecord('list', { name: 'two' });

  assert.equal(get(list, 'id'), 'l2', "id is loaded correctly");
  assert.equal(get(list, 'name'), 'two', "name is loaded correctly");
  assert.equal(get(list, 'b'), false, "b is loaded correctly");
  assert.equal(get(list, 'day'), 2, "day is loaded correctly");

  try {
    await store.queryRecord('list', { whatever: "dude" });
  } catch(e) {
    assert.ok(true, "didn't find record for nonsense");
  }
});

// Relationship loading
//------------------------------------------------------------------------------

function assertionsForHasManyRelationships(assert, items) {
  assert.expect(4);
  let item1 = items.get('firstObject');
  let item2 = items.get('lastObject');
  assert.equal(get(item1, 'id'), 'i1', "first item id is loaded correctly");
  assert.equal(get(item1, 'name'), 'one', "first item name is loaded correctly");
  assert.equal(get(item2, 'id'), 'i2', "first item id is loaded correctly");
  assert.equal(get(item2, 'name'), 'two', "first item name is loaded correctly");
}

test("load hasMany relationships when finding a single record", async function(assert) {
  let list = await run(() => store.findRecord('list', 'l1'));
  let items = await run(() => list.get('items'));

  assertionsForHasManyRelationships(assert, items);
});

test("load hasMany relationships when finding multiple records", async function(assert) {
  let lists = await run(() => store.findAll('list'));
  let items = await run(() => lists.get('firstObject.items'));

  assertionsForHasManyRelationships(assert, items);
});

async function assertionsForMissingHasManyRelationships(assert, post) {
  assert.expect(2);

  try {
    await post.get('comments');
  } catch(e) {
    assert.ok(true, "Missing comments prevent all comments from being loaded");
  }

  try {
    await post.get('subscribers');
  } catch(e) {
    assert.ok(true, "Missing external subscribers prevent all comments from being loaded");
  }
}

test("load with missing hasMany relationships when finding a single record", async function(assert) {
  let post = await run(() => store.findRecord('post', 'p1'));

  await assertionsForMissingHasManyRelationships(assert, post);
});

test("load with missing hasMany relationships when finding multiple records", async function(assert) {
  let posts = await run(() => store.findAll('post'));

  await assertionsForMissingHasManyRelationships(assert, posts.get('firstObject'));
});

function assertionsForBelongsToRelationships(assert, list) {
  assert.equal(get(list, 'id'), 'l1', "id is loaded correctly");
  assert.equal(get(list, 'name'), 'one', "name is loaded correctly");
}

test("load belongsTo relationships when finding a single record", async function(assert) {
  let item = await run(() => store.findRecord('item', 'i1'));
  let list = await run(() => item.get('list'));

  assertionsForBelongsToRelationships(assert, list);
});

test("load belongsTo relationships when finding multiple records", async function(assert) {
  let items = await run(() => store.findAll('item'));
  let list = await run(() => items.get('firstObject.list'));

  assertionsForBelongsToRelationships(assert, list);
});

test("load with missing belongsTo relationships when finding a single record", async function(assert) {
  assert.expect(2);

  let comment = await run(() => store.findRecord('comment', 'c2'));

  try {
    await comment.get('post');
  } catch(e) {
    assert.ok(true, "Related post can\'t be resolved");
  }

  comment = await run(() => store.findRecord('comment', 'c4'));

  try {
    await comment.get('author');
  } catch(e) {
    assert.ok(true, "External related author can\'t be resolved");
  }
});

test("load with missing belongsTo relationships when finding multiple records", async function(assert) {
  assert.expect(2);

  let comments = await run(() => store.findAll('comment'));

  try {
    await run(() => comments.objectAt(1).get('post'));
  } catch(e) {
    assert.ok(true, "Related post can\'t be resolved");
  }

  try {
    await run(() => comments.objectAt(3).get('author'));
  } catch(e) {
    assert.ok(true, "External related author can\'t be resolved");
  }
});

test("load hasMany relationships when querying multiple records", async function(assert) {
  assert.expect(11);

  let records = await run(() => store.query('order', { b: true }));
  let firstRecord = records.objectAt(0);
  let secondRecord = records.objectAt(1);
  let thirdRecord = records.objectAt(2);

  assert.equal(get(records, 'length'), 3, "3 orders were found");
  assert.equal(get(firstRecord, 'name'), "one", "First order's name is one");
  assert.equal(get(secondRecord, 'name'), "three", "Second order's name is three");
  assert.equal(get(thirdRecord, 'name'), "four", "Third order's name is four");

  let [firstHours, secondHours, thirdHours] = await Ember.RSVP.all(run(() => [
    firstRecord.get('hours'),
    secondRecord.get('hours'),
    thirdRecord.get('hours')
  ]));

  assert.equal(get(firstHours, 'length'), 2, "Order one has two hours");
  assert.equal(get(secondHours, 'length'), 2, "Order three has two hours");
  assert.equal(get(thirdHours, 'length'), 0, "Order four has no hours");

  let hourOne = firstHours.objectAt(0);
  let hourTwo = firstHours.objectAt(1);
  let hourThree = secondHours.objectAt(0);
  let hourFour = secondHours.objectAt(1);

  assert.equal(get(hourOne, 'amount'), 4, "Hour one has amount of 4");
  assert.equal(get(hourTwo, 'amount'), 3, "Hour two has amount of 3");
  assert.equal(get(hourThree, 'amount'), 2, "Hour three has amount of 2");
  assert.equal(get(hourFour, 'amount'), 1, "Hour four has amount of 1");
});

// Relationship saving
//------------------------------------------------------------------------------

test("save belongsTo relationships", async function(assert) {
  let listId = 'l2';

  let list = await run(() => store.findRecord('list', listId));
  let item = run(() => store.createRecord('item', { name: 'three thousand' }));
  run(() => item.set('list', list));
  await run(() => item.save());
  let itemId = item.get('id');
  run(() => store.unloadAll('item'));
  item = await run(() => store.findRecord('item', itemId));
  list = await item.get('list');

  assert.ok(item.get('list'), "list is present");
  assert.equal(list.id, listId, "list is retrieved correctly");
});

test("save hasMany relationships", async function(assert) {
  let listId = 'l2';

  let list = await run(() => store.findRecord('list', listId))
  let item = run(() => store.createRecord('item', { name: 'three thousand' }));
  let items = await run(() => list.get('items'));

  run(() => items.pushObject(item));
  await run(() => item.save());
  await run(() => list.save());

  run(() => store.unloadAll('list'));

  list = await run(() => store.findRecord('list', listId));
  items = await run(() => list.get('items'));
  let item1 = items.objectAt(0);

  assert.equal(item1.get('name'), 'three thousand', "item is saved");
});

// Bulk operations
//------------------------------------------------------------------------------

test("perform multiple changes in bulk", async function(assert) {
  assert.expect(3);
  let promises = [];

  await run(async () => {
    promises.push(
      store.findRecord('list', 'l1').then((list) => {
        list.set('name', 'updated');
        return list.save();
      })
    );

    promises.push(
      store.createRecord('list', { name: 'Rambo' }).save()
    );

    promises.push(
      store.findRecord('list', 'l2').then((list) => {
        return list.destroyRecord();
      })
    );

    await Ember.RSVP.all(promises).then(() => {
      promises = [];

      promises.push(
        store.findRecord('list', 'l1').then((list) => {
          assert.equal(get(list, 'name'), 'updated', "Record was updated successfully");
        })
      );

      promises.push(
        store.query('list', {
          name: 'Rambo'
        }).then((lists) => {
          assert.equal(get(lists, 'length'), 1, "Record was created successfully");
        })
      );

      promises.push(
        store.findRecord('list', 'l2').catch(() => {
          assert.ok(true, "Record was deleted successfully");
        })
      );

      return Ember.RSVP.all(promises);
    });
  });
});
