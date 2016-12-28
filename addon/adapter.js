import Ember from 'ember';
import JSONAPIAdapter from 'ember-data/adapters/json-api';

import storage, { STORE_NAME } from './-storage';
import {
  passthrough,
  clone,
  groupBy,
  uuid,
  isFastBoot
} from './-utils';
import Queue from './-queue';
import Error from './-error';

const { computed, RSVP } = Ember;

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
    let payload = snapshot.dump();

    if (isFastBoot) {
      payload = passthrough({ data: payload });

      return RSVP.resolve(payload);
    }

    return this.save(snapshot.modelName, [payload]);
  },

  localUpdateRecord(store, snapshot) {
    let payload = snapshot.dump();

    if (isFastBoot) {
      payload = passthrough({ data: payload });

      return RSVP.resolve(payload);
    }

    return this.save(snapshot.modelName, [payload]);
  },

  localDeleteRecord(store, snapshot) {
    if (isFastBoot) { return RSVP.resolve(); }

    let payload = {
      id: snapshot.id,
      type: snapshot.modelName,
      meta: { deleted: true }
    };

    return this.save(snapshot.modelName, [payload]);
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
      let payload = null;

      if (this.shouldNetworkCreateRecord(type, snapshot.id)) {
        payload = await this.networkCreateRecord(...arguments);
      }

      if (!isFastBoot) {
        if (payload) {
          payload = this.normalizeResponse(store, type, payload, null, 'createRecord');
          await this.savePayload(store, payload);
        } else {
          await this.localCreateRecord(store, snapshot);
        }
      }

      return payload;
    } catch(e) {
      return this.localCreateRecord(store, snapshot);
    }
  },

  async updateRecord(store, type, snapshot) {
    try {
      let payload = null;

      if (this.shouldNetworkUpdateRecord(type, snapshot.id)) {
        payload = await this.networkUpdateRecord(...arguments);
      }

      if (!isFastBoot) {
        if (payload) {
          payload = this.normalizeResponse(store, type, payload, null, 'updateRecord');
          await this.savePayload(store, payload);
        } else {
          await this.localUpdateRecord(store, snapshot);
        }
      }

      return payload;
    } catch(e) {
      return this.localUpdateRecord(store, snapshot);
    }
  },

  async deleteRecord(store, type, snapshot) {
    try {
      if (this.shouldNetworkDeleteRecord(type, snapshot.id)) {
        await this.networkDeleteRecord(...arguments);
      }

      if (!isFastBoot) {
        await this.localDeleteRecord(store, snapshot);
      }

      return null;
    } catch(e) {
      return this.localDeleteRecord(store, snapshot);
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

    serializer.serializeDataAttributes(type, payload.data);

    let included = groupBy(payload.included || [], 'type');
    for (let modelName in included) {
      this.serializeDataAttributes(store.modelFor(modelName), included[modelName]);
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

    for (let modelName in data) {
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
          datum.meta = datum.meta || {};
          datum.meta.ts = Date.now();
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
    return storage(this.get('namespace'));
  }),

  /**
   * @private
   */
  shoebox: computed(function() {
    let shoebox = this.get('fastboot.shoebox');

    if (shoebox) {
      return (shoebox.retrieve(STORE_NAME) || {}).cache;
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
    let expireIn = this.get('expireIn');

    if (this.caching) {
      let cache = this.cache.get(modelName);

      if (cache) {
        if (dropExpired(cache, expireIn)) {
          await this.writeToLocalStorage(modelName, cache);
        }

        return clone(cache);
      }
    }

    let data = await this.readFromLocalStorage(modelName);
    let didChange = dropExpired(data, expireIn);
    let cache = this.get(`shoebox.${modelName}`);

    if (cache) {
      didChange = didChange || dropExpired(cache, expireIn);
      Object.assign(data, cache);
    }

    if (didChange) {
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

function dropExpired(data, expireIn) {
  if (!expireIn) { return false; }

  let didChange = false;

  Object.keys(data).forEach((id) => {
    if (data[id].meta && data[id].meta.ts) {
      if (isExpired(expireIn, new Date(data[id].meta.ts))) {
        didChange = true;
        delete data[id];
      }
    }
  });

  return didChange;
}

function isExpired(expireIn, ts) {
  return (Date.now() / 1000) >= ((ts / 1000) + expireIn);
}
