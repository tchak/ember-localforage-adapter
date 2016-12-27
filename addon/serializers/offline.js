import JSONAPISerializer from 'ember-data/serializers/json-api';
import { shouldPassthrough } from '../-private/passthrough';
import { groupBy } from 'lodash';

export default JSONAPISerializer.extend({
  normalizeResponse(store, type, payload) {
    if (shouldPassthrough(payload)) {
      this.applyTransformsToAttributes(type, payload.data);

      let included = groupBy(payload.included || [], 'type');
      for (let modelName in included) {
        this.applyTransformsToAttributes(store.modelFor(modelName), included[modelName]);
      }

      return payload;
    }

    return this._super(...arguments);
  },

  applyTransformsToAttributes(type, data) {
    if (!Array.isArray(data)) { data = [data]; }

    for (let datum of data) {
      this.applyTransforms(type, datum.attributes);
    }
  },

  serializeAttributesValues(type, data) {
    if (!Array.isArray(data)) { data = [data]; }

    for (let datum of data) {
      type.eachAttribute((key, attribute) => {
        datum.attributes[key] = this.transformFor(attribute.type)
          .serialize(datum.attributes[key], attribute.options);
      });
    }
  }
});
