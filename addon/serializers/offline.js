import JSONAPISerializer from 'ember-data/serializers/json-api';

import { shouldPassthrough, groupBy } from '../-utils';

export default JSONAPISerializer.extend({
  normalizeResponse(store, type, payload) {
    if (shouldPassthrough(payload)) {
      this.deserializeDataAttributes(type, payload.data);

      let included = groupBy(payload.included || [], 'type');
      for (let modelName in included) {
        this.deserializeDataAttributes(store.modelFor(modelName), included[modelName]);
      }

      return payload;
    }

    return this._super(...arguments);
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
      type.eachAttribute((key, attribute) => {
        datum.attributes[key] = this.transformFor(attribute.type)
          .serialize(datum.attributes[key], attribute.options);
      });
    }
  }
});
