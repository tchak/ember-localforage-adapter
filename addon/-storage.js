import localforage from 'localforage';

export const STORE_NAME = 'ember-data-store';

export default function(namespace) {
  let storeName = namespace ? `${STORE_NAME}-${namespace}` : STORE_NAME;
  return localforage.createInstance({ storeName });
}
