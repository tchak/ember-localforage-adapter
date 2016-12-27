import serialize from './serialize-snapshot';

export default function(store) {
  return Object.keys(store.typeMaps).map(k => {
    let { modelName } = store.typeMaps[k].type;
    return [modelName, peekAll(store, modelName)];
  }).reduce((hash, [modelName, records]) => {
    hash[modelName] = records.reduce((hash, record) => {
      let snapshot = record._createSnapshot();
      hash[snapshot.id] = serialize(snapshot);
      return hash;
    }, {});
    return hash;
  }, {});
}

function peekAll(store, modelName) {
  return store.peekAll(modelName)
    .toArray()
    .filter(serializableRecord);
}

function serializableRecord(record) {
  return !(record.get('isDeleted') || record.get('isNew'));
}
