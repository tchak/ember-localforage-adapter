import Ember from 'ember';
import JSONAPIAdapter from 'ember-data/adapters/json-api';
import { cloneDeep as clone, groupBy } from 'lodash';
import localforage, { STORE_NAME } from '../localforage';
import uuid from '../-private/uuid';
import Queue from '../-private/queue';
import Error from '../-private/error';
import { passthrough } from '../-private/passthrough';
import { toJSON } from '../-private/snapshot';

const { computed, RSVP } = Ember;

const isFastBoot = typeof FastBoot !== 'undefined';

const {
  findRecord: networkFindRecord,
  findAll: networkFindAll,
  findMany: networkFindMany,
  query: networkQuery,
  queryRecord: networkQueryRecord,
  createRecord: networkCreateRecord,
  updateRecord: networkUpdateRecord,
  deleteRecord: networkDeleteRecord
} = JSONAPIAdapter.proto();

class NotFoundError extends Error {}

export default JSONAPIAdapter.extend({
  defaultSerializer: 'offline',
  caching: true,
  coalesceFindRequests: true,

  init() {
    this._super();

    this.queue = new Queue();

    if (this.caching) {
      this.cache = new Map();
    }
  },

  shouldBackgroundReloadRecord() {
    return false;
  },

  shouldReloadAll() {
    return true;
  },

  generateIdForRecord() {
    if (!this.shouldNetworkCreateRecord()) {
      return uuid();
    }
  },

  networkFindRecord,
  networkFindAll,
  networkFindMany,
  networkQueryRecord,
  networkQuery,
  networkCreateRecord,
  networkUpdateRecord,
  networkDeleteRecord,

  shouldNetworkRequest() {
    return this.isOnLine();
  },

  isOnLine() {
    return isFastBoot || navigator.onLine !== false;
  },

  shouldNetworkReloadRecord() {
    return this.shouldNetworkRequest();
  },

  shouldNetworkReloadAll() {
    return this.shouldNetworkRequest();
  },

  shouldNetworkFindMany() {
    return this.shouldNetworkRequest();
  },

  shouldNetworkQueryRecord() {
    return this.shouldNetworkRequest();
  },

  shouldNetworkQuery() {
    return this.shouldNetworkRequest();
  },

  shouldNetworkCreateRecord() {
    return this.shouldNetworkRequest();
  },

  shouldNetworkUpdateRecord() {
    return this.shouldNetworkRequest();
  },

  shouldNetworkDeleteRecord() {
    return this.shouldNetworkRequest();
  },

  localFindRecord(store, type, id) {
    if (isFastBoot) { return RSVP.resolve(null); }

    return this.queue.attach(async (resolve) => {
      let data = await this.getData(type.modelName);
      let record = data[id];

      if (record) {
        resolve(passthrough({ data: record }));
      } else {
        resolve(null);
      }
    });
  },

  localFindAll(store, type) {
    if (isFastBoot) { return RSVP.resolve(null); }

    return this.queue.attach(async (resolve) => {
      let data = await this.getData(type.modelName);
      let records = [];

      for (let id in data) {
        records.push(data[id]);
      }

      if (records.length > 0) {
        resolve(passthrough({ data: records }));
      } else {
        resolve(null);
      }
    });
  },

  localFindMany(store, type, ids) {
    if (isFastBoot) { return RSVP.resolve(null); }

    return this.queue.attach(async (resolve) => {
      let data = await this.getData(type.modelName);
      let records = [];

      for (let id of ids) {
        let record = data[id];

        if (record) {
          records.push(record);
        }
      }

      resolve(passthrough({ data: records }));
    });
  },

  localQueryRecord(store, type, query) {
    if (isFastBoot) { return RSVP.resolve(null); }

    return this.queue.attach(async (resolve) => {
      let data = await this.getData(type.modelName);
      let record = this.queryLocalCache(data, query, true);

      if (record) {
        resolve(passthrough({ data: record }));
      } else {
        resolve(null);
      }
    });
  },

  localQuery(store, type, query) {
    if (isFastBoot) { return RSVP.resolve(null); }

    return this.queue.attach(async (resolve) => {
      let data = await this.getData(type.modelName);
      let records = this.queryLocalCache(data, query);

      resolve(passthrough({ data: records }));
    });
  },

  localCreateRecord(store, snapshot) {
    let payload = toJSON(snapshot);

    if (isFastBoot) { return RSVP.resolve(passthrough({ data: payload })); }

    return this.save(snapshot.modelName, [payload]);
  },

  localUpdateRecord(store, snapshot) {
    let payload = toJSON(snapshot);

    if (isFastBoot) { return RSVP.resolve(passthrough({ data: payload })); }

    return this.save(snapshot.modelName, [payload]);
  },

  localDeleteRecord(store, snapshot) {
    if (isFastBoot) { return RSVP.resolve(); }

    return this.save(snapshot.modelName, [
      {
        id: snapshot.id,
        type: snapshot.modelName,
        meta: { deleted: true }
      }
    ]);
  },

  async findRecord(store, type, id) {
    let payload = await this.localFindRecord(...arguments);

    if (!payload && this.shouldNetworkReloadRecord(type, id)) {
      payload = await this.networkFindRecord(...arguments);

      if (!isFastBoot) {
        payload = this.normalizeResponse(store, type, payload, id, 'findRecord')
        await this.savePayload(store, payload);
      }
    }

    if (!payload) { throw new NotFoundError(); }

    return payload;
  },

  async findAll(store, type) {
    let payload = await this.localFindAll(...arguments);

    if (!payload && this.shouldNetworkReloadAll(type)) {
      payload = await this.networkFindAll(...arguments);

      if (!isFastBoot) {
        payload = this.normalizeResponse(store, type, payload, null, 'findAll');
        await this.savePayload(store, payload);
      }
    }

    if (!payload) {
      return passthrough({ data: [] });
    }

    return payload;
  },

  async findMany(store, type, ids) {
    let payload = await this.localFindMany(...arguments);

    if (!payload && this.shouldNetworkFindMany(type, ids)) {
      payload = await this.networkFindMany(...arguments);

      if (!isFastBoot) {
        payload = this.normalizeResponse(store, type, payload, null, 'findMany');
        await this.savePayload(store, payload);
      }
    }

    if (!payload) {
      return passthrough({ data: [] });
    }

    return payload;
  },

  async queryRecord(store, type, query) {
    let payload = await this.localQueryRecord(...arguments);

    if (!payload && this.shouldNetworkQueryRecord(type, query)) {
      payload = await this.networkQueryRecord(...arguments);

      if (!isFastBoot) {
        payload = this.normalizeResponse(store, type, payload, null, 'queryRecord');
        await this.savePayload(store, payload);
      }
    }

    if (!payload) { throw new NotFoundError(); }

    return payload;
  },

  async query(store, type, query) {
    let payload = await this.localQuery(...arguments);

    if (!payload && this.shouldNetworkQuery(type, query)) {
      payload = await this.networkQuery(...arguments);

      if (!isFastBoot) {
        payload = this.normalizeResponse(store, type, payload, null, 'query');
        await this.savePayload(store, payload);
      }
    }

    if (!payload) {
      return passthrough({ data: [] });
    }

    return payload;
  },

  async createRecord(store, type, snapshot) {
    try {
      if (this.shouldNetworkCreateRecord(type, snapshot.id)) {
        await this.networkCreateRecord(...arguments);
      }
    } finally {
      /* eslint-disable no-unsafe-finally */
      return this.localCreateRecord(store, snapshot);
      /* eslint-enable no-unsafe-finally */
    }
  },

  async updateRecord(store, type, snapshot) {
    try {
      if (this.shouldNetworkUpdateRecord(type, snapshot.id)) {
        await this.networkUpdateRecord(...arguments);
      }
    } finally {
      /* eslint-disable no-unsafe-finally */
      return this.localUpdateRecord(store, snapshot);
      /* eslint-enable no-unsafe-finally */
    }
  },

  async deleteRecord(store, type, snapshot) {
    try {
      if (this.shouldNetworkDeleteRecord(type, snapshot.id)) {
        await this.networkDeleteRecord(...arguments);
      }
    } finally {
      /* eslint-disable no-unsafe-finally */
      return this.localDeleteRecord(store, snapshot);
      /* eslint-enable no-unsafe-finally */
    }
  },

  async clearAll() {
    await this.get('localforage').clear();
    this.cache.clear();
    this.queue = new Queue();
  },

  /**
   * @private
   */
  queryLocalCache(records, query, singleMatch) {
    let results = singleMatch ? null : [];

    for (let id in records) {
      let record = records[id];
      let isMatching = false;

      for (let property in query) {
        let queryValue = query[property];
        let attributeValue = record.attributes[property];

        if (property === 'id') {
          attributeValue = record[property];
        }

        if (queryValue instanceof RegExp) {
          isMatching = queryValue.test(attributeValue);
        } else {
          isMatching = attributeValue === queryValue;
        }

        if (!isMatching) {
          break; // all criteria should pass
        }
      }

      if (isMatching) {
        if (singleMatch) {
          return record;
        }

        results.push(record);
      }
    }

    return results;
  },

  /**
   * @private
   */
  normalizeResponse(store, type, payload, id, requestType) {
    let serializer = store.serializerFor(type.modelName);

    payload = serializer.normalizeResponse(store, type, payload, id, requestType);

    serializer.serializeAttributesValues(type, payload.data);

    let included = groupBy(payload.included || [], 'type');
    for (let modelName in included) {
      this.serializeAttributesValues(store.modelFor(modelName), included[modelName]);
    }

    return passthrough(payload);
  },

  /**
   * @private
   */
  async savePayload(store, payload) {
    let data = [];

    if (Array.isArray(payload.data)) {
      data.push(...payload.data);
    } else {
      data.push(payload.data);
    }

    if (payload.included) {
      data.push(...payload.included);
    }

    data = groupBy(data, 'type');

    //let serializer;
    for (let modelName in data) {
      //serializer = serializer || store.serializerFor(modelName);
      //serializer.serializeAttributesValues(store.modelFor(modelName), data[modelName]);
      await this.save(modelName, data[modelName]);
    }
  },

  /**
   * @private
   */
  save(modelName, data) {
    return this.queue.attach(async (resolve) => {
      let cache = await this.getData(modelName);

      for (let datum of data) {
        if (datum.meta && datum.meta.deleted) {
          delete cache[datum.id];
        } else {
          cache[datum.id] = datum;
        }
      }

      await this.setData(modelName, cache);

      resolve();
    });
  },

  /**
   * @private
   */
  localforage: computed(function() {
    return localforage(this.get('namespace'));
  }),

  /**
   * @private
   */
  shoebox: computed(function() {
    let shoebox = this.get('fastboot.shoebox');

    if (shoebox) {
      return (shoebox.retrieve(STORE_NAME) || {}).records;
    }
  }),

  /**
   * @private
   */
  setData(modelName, data) {
    if (this.caching) {
      this.cache.set(modelName, clone(data));
    }

    return this.writeToLocalStorage(modelName, data);
  },

  /**
   * @private
   */
  async getData(modelName) {
    if (this.caching) {
      let cache = this.cache.get(modelName);

      if (cache) {
        return clone(cache);
      }
    }

    let data = await this.readFromLocalStorage(modelName);
    let cache = this.get(`shoebox.${modelName}`);

    if (cache) {
      Object.assign(data, cache);
      await this.writeToLocalStorage(modelName, data);
    }

    if (this.caching) {
      this.cache.set(modelName, clone(data));
    }

    return data;
  },

  /**
   * @private
   */
  async readFromLocalStorage(modelName) {
    return (await this.get('localforage').getItem(modelName)) || {};
  },

  /**
   * @private
   */
  writeToLocalStorage(modelName, data) {
    return this.get('localforage').setItem(modelName, data || {});
  }
});

