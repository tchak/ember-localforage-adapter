import Snapshot from 'ember-data/-private/system/snapshot';

Snapshot.prototype.dump = function() {
  let serializer = this.record.store
    .serializerFor(this.modelName);

  let data = {
    type: this.modelName,
    id: this.id,
    attributes: this.attributes(),
    relationships: {}
  };

  serializer.serializeDataAttributes(this.type, data);

  this.eachRelationship((key, { type, kind }) => {
    data.relationships[key] = {};

    if (kind === 'hasMany') {
      let ids = this.hasMany(key, { ids: true });

      data.relationships[key].data = ids ? ids.map((id) => ({
        type, id
      })) : [];
    } else {
      let id = this.belongsTo(key, { id: true });

      data.relationships[key].data = id ? { type, id } : null;
    }
  });

  return data;
};
