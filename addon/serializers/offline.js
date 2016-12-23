import JSONAPISerializer from 'ember-data/serializers/json-api';

export default JSONAPISerializer.extend({
  modelNameFromPayloadKey(key) {
    return key;
  },

  payloadKeyFromModelName(modelName) {
    return modelName;
  },

  modelNameFromPayloadType(type) {
    return type;
  },

  payloadTypeFromModelName(modelName) {
    return modelName;
  },

  _shouldSerializeHasMany(snapshot, key, relationship) {
    const relationshipType = snapshot.type.determineRelationshipType(relationship, this.store);

    if (this._mustSerialize(key)) {
      return true;
    }

    return this._canSerialize(key) &&
      (relationshipType === 'manyToNone' ||
        relationshipType === 'manyToMany' ||
        relationshipType === 'manyToOne');
  }
});
