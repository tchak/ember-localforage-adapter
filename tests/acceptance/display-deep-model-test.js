import Ember from 'ember';
import { test } from 'ember-qunit';
import moduleForAcceptance from '../helpers/module-for-acceptance';
import FIXTURES from '../helpers/fixtures/display-deep-model';
import loadFixtures from '../helpers/load-fixtures';
import { offLine } from '../helpers/on-line';

moduleForAcceptance('Acceptance | Display deep model', {
  async beforeEach() {
    offLine();
    let adapter = this.application.__container__.lookup('adapter:application');

    await adapter.clearAll();
    await loadFixtures(FIXTURES);
  }
});

test('Find customer -> hour -> order', async function(assert) {
  assert.expect(4);

  await visit('/purchase/1');

  await timeout(200);

  assert.equal(find('div.name').text(), 'credits');
  assert.equal(find('div.amount').text(), '10');
  assert.equal(find('div.player').text(), 'one');
  assert.equal(find('div.ledger').text(), 'payable');
});

function timeout(ms = 100) {
  return new Ember.RSVP.Promise(r => {
    Ember.run.later(r, ms);
  });
}
