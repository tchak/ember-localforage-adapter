import JSONAPISerializer from 'ember-data/serializers/json-api';

import { shouldPassthrough, groupBy } from './-utils';

function wrapNormalizeResponse(normalizeResponse) {
  return function(store, type, payload) {
    if (shouldPassthrough(payload)) {
      this.deserializeDataAttributes(type, payload.data);

      let included = groupBy(payload.included || [], 'type');
      for (let modelName in included) {
        this.deserializeDataAttributes(store.modelFor(modelName), included[modelName]);
      }

      return payload;
    }

    return normalizeResponse.apply(this, arguments);
  };
}

export default JSONAPISerializer.extend({
  init() {
    this._super();
    this.normalizeResponse = wrapNormalizeResponse(this.normalizeResponse);
  },

  unapplyTransforms(type, attributes) {
    type.eachAttribute((key, { type, options }) => {
      if (type) {
        let transform = this.transformFor(type);
        attributes[key] = transform.serialize(attributes[key], options);
      }
    });
  },

  deserializeDataAttributes(type, data) {
    if (!Array.isArray(data)) { data = [data]; }

    for (let datum of data) {
      this.applyTransforms(type, datum.attributes);
    }
  },

  serializeDataAttributes(type, data) {
    if (!Array.isArray(data)) { data = [data]; }

    for (let datum of data) {
      this.unapplyTransforms(type, datum.attributes);
    }
  }
});
