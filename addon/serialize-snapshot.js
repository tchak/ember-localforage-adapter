export default function(snapshot) {
  let serializer = snapshot.record.store
    .serializerFor(snapshot.modelName);

  let data = {
    type: snapshot.modelName,
    id: snapshot.id,
    attributes: snapshot.attributes(),
    relationships: {}
  };

  serializer.serializeDataAttributes(snapshot.type, data);

  snapshot.eachRelationship((key, { type, kind }) => {
    data.relationships[key] = {};

    if (kind === 'hasMany') {
      let ids = snapshot.hasMany(key, { ids: true });

      data.relationships[key].data = ids ? ids.map((id) => ({
        type, id
      })) : [];
    } else {
      let id = snapshot.belongsTo(key, { id: true });

      data.relationships[key].data = id ? { type, id } : null;
    }
  });

  return data;
}
