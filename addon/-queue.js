import Ember from 'ember';

const { RSVP } = Ember;

export default class Queue {
  constructor() {
    this.queue = [RSVP.resolve()];
  }

  attach(callback) {
    let queueKey = this.queue.length;

    this.queue[queueKey] = new RSVP.Promise((resolve, reject) => {
      this.queue[queueKey - 1].finally(() => {
        this.queue.splice(queueKey - 1, 1);
        callback(resolve, reject);
      });
    });

    return this.queue[queueKey];
  }
}
