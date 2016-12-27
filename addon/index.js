import './-snapshot';
import './-store';

export { default } from './adapter';
export { default as Adapter } from './adapter';
export { default as Serializer } from './serializer';
export { uuid, clone } from './-utils';
export { default as storage, STORE_NAME } from './localforage';
