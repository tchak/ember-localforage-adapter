import localforage from 'localforage';
import { compact } from './-utils';

export default function(options = {}) {
  return localforage.createInstance(compact(options));
}
