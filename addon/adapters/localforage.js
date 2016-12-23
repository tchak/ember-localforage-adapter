import Ember from 'ember';
import JSONAPIAdapter from 'ember-data/adapters/json-api';
import { cloneDeep as clone } from 'lodash';
import localforage from 'localforage';
import uuid from 'uuid';
import Queue from '../-private/queue';
import Error from '../-private/error';

const { computed } = Ember;

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

const STORE_NAME = 'ember-data-store';

class NotFoundError extends Error {}

export default JSONAPIAdapter.extend({
  defaultSerializer: 'localforage',
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
    return false; //this.isOnLine();
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

  attach(callback) {
    return this.queue.attach((resolve, reject) => {
      if (this.isOnLine()) {
        callback(resolve, reject);
      } else {
        reject();
      }
    });
  },

  localFindRecord(store, type, id) {
    return this.queue.attach(async (resolve, reject) => {
      let data = await this.getData(type);
      let record = data[id];

      if (record) {
        resolve({ data: record });
      } else {
        reject(new NotFoundError(`Not found: ${type.modelName}#${id}`));
      }
    });
  },

  localFindAll(store, type) {
    return this.queue.attach(async (resolve, reject) => {
      let data = await this.getData(type);
      let records = [];

      for (let id in data) {
        records.push(data[id]);
      }

      if (records.length > 0) {
        resolve({ data: records });
      } else {
        reject(new NotFoundError());
      }
    });
  },

  localFindMany(store, type, ids) {
    return this.queue.attach(async (resolve) => {
      let data = await this.getData(type);
      let records = [];

      for (let id of ids) {
        let record = data[id];

        if (record) {
          records.push(record);
        }
      }

      resolve({ data: records });
    });
  },

  localQueryRecord(store, type, query) {
    return this.queue.attach(async (resolve, reject) => {
      let data = await this.getData(type);
      let record = this.queryLocalCache(data, query, true);

      if (record) {
        resolve({ data: record });
      } else {
        reject(new NotFoundError(`Not found: ${type.modelName}#${query}`));
      }
    });
  },

  localQuery(store, type, query) {
    return this.queue.attach(async (resolve) => {
      let data = await this.getData(type);
      let records = this.queryLocalCache(data, query);

      resolve({ data: records });
    });
  },

  localUpdateRecord(store, type, snapshot) {
    let { data } = this.serializeRecord(store, type, snapshot);

    return this.save(type, data);
  },

  localDeleteRecord(store, type, snapshot) {
    return this.save(type, { id: snapshot.id, meta: { deleted: true } });
  },

  async findRecord(store, type, id) {
    try {
      return this.localFindRecord(...arguments);
    } catch (e) {
      if (this.shouldNetworkReloadRecord(type, id)) {
        let data = await this.networkFindRecord(...arguments);
        await this.save(type, data.data);
        return data;
      }

      throw e;
    }
  },

  async findAll(store, type) {
    try {
      return this.localFindAll(...arguments);
    } catch(e) {
      if (this.shouldNetworkReloadAll(type)) {
        let data = await this.networkFindAll(...arguments);
        await this.save(type, data.data, true);
        return data;
      }

      return { data: [] };
    }
  },

  async findMany(store, type, ids) {
    try {
      return this.localFindMany(...arguments);
    } catch(e) {
      if (this.shouldNetworkFindMany(type, ids)) {
        let data = await this.networkFindMany(...arguments);
        await this.save(type, data.data);
        return data;
      }

      return { data: [] };
    }
  },

  async queryRecord(store, type, query) {
    try {
      return this.localQueryRecord(...arguments);
    } catch(e) {
      if (this.shouldNetworkQueryRecord(type, query)) {
        let data = await this.networkQueryRecord(...arguments);
        await this.save(type, [data.data]);
        return data;
      }

      throw e;
    }
  },

  async query(store, type, query) {
    try {
      return this.localQuery(...arguments);
    } catch(e) {
      if (this.shouldNetworkQuery(type, query)) {
        let data = await this.networkQuery(...arguments);
        await this.save(type, data.data);
        return data;
      }

      return { data: [] };
    }
  },

  async createRecord(store, type, snapshot) {
    try {
      if (this.shouldNetworkCreateRecord(type, snapshot.id)) {
        await this.networkCreateRecord(...arguments);
      }
    } finally {
      /* eslint-disable no-unsafe-finally */
      return this.localUpdateRecord(...arguments);
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
      return this.localUpdateRecord(...arguments);
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
      return this.localDeleteRecord(...arguments);
      /* eslint-enable no-unsafe-finally */
    }
  },

  clear(type) {
    return this.save(type, [], true);
  },

  async clearAll() {
    await this.get('localforage').clear();
    this.cache.clear();
    this.queue = new Queue();
  },

  async push({ data, included }) {
    data = clone(data);
    included = clone(included);

    if (!Array.isArray(data)) {
      data = [data];
    }

    if (included) {
      data = data.concat(included);
    }

    let dataByModelName = {};

    for (let record of data) {
      dataByModelName[record.type] = dataByModelName[record.type] || [];
      dataByModelName[record.type].push(record);
    }

    for (let modelName in dataByModelName) {
      await this.save({ modelName }, dataByModelName);
    }
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
  serializeRecord(store, { modelName }, snapshot) {
    let serializer = store.serializerFor(modelName);
    return serializer.serialize(snapshot, { includeId: true });
  },

  /**
   * @private
   */
  save(type, payload, replace = false) {
    return this.queue.attach(async (resolve) => {
      let data = {};

      if (!replace) {
        data = await this.getData(type);

        if (Array.isArray(payload)) {
          for (let record of payload) {
            data[record.id] = record;
          }
        } else if (payload.meta && payload.meta.deleted) {
          delete data[payload.id];
        } else {
          data[payload.id] = payload;
        }
      }

      await this.setData(type, data);

      resolve();
    });
  },

  /**
   * @private
   */
  localforage: computed(function() {
    let namespace = this.get('namespace');

    let storeName = namespace ? `${STORE_NAME}-${namespace}` : STORE_NAME;

    return localforage.createInstance({ storeName });
  }),

  /**
   * @private
   */
  setData({ modelName }, data) {
    if (this.caching) {
      this.cache.set(modelName, data);
    }

    return this.writeData(modelName, data);
  },

  /**
   * @private
   */
  async getData({ modelName }) {
    if (this.caching) {
      let cache = this.cache.get(modelName);

      if (cache) {
        return clone(cache);
      }
    }

    let data = await this.readData(modelName);

    if (this.caching) {
      this.cache.set(modelName, clone(data));
    }

    return data;
  },

  /**
   * @private
   */
  readData(modelName) {
    return this.get('localforage').getItem(modelName) || {};
  },

  /**
   * @private
   */
  writeData(modelName, data) {
    return this.get('localforage').setItem(modelName, data || {});
  }
});
