import Store from 'ember-data/-private/system/store';

Store.reopen({
  dump() {
    return Object.keys(this.typeMaps).map(k => {
      let { modelName } = this.typeMaps[k].type;
      return [modelName, peekAll(this, modelName)];
    }).reduce((hash, [modelName, records]) => {
      hash[modelName] = records.reduce((hash, record) => {
        let snapshot = record._createSnapshot();
        hash[snapshot.id] = snapshot.dump();
        return hash;
      }, {});
      return hash;
    }, {});
  }
});

function peekAll(store, modelName) {
  return store.peekAll(modelName)
    .toArray()
    .filter(serializableRecord);
}

function serializableRecord(record) {
  return !(record.get('isDeleted') || record.get('isNew'));
}
