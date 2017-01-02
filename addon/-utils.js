export { default as uuid } from './-private/uuid';
export { default as clone } from './-private/clone';

export const isFastBoot = typeof FastBoot !== 'undefined';

export function shouldPassthrough(payload) {
  return payload && payload.meta && payload.meta.passthrough;
}

export function passthrough(payload) {
  if (payload) {
    if (!payload.meta) {
      payload.meta = {};
    }
    payload.meta.passthrough = true;
  }

  return payload;
}

export function groupBy(array, key) {
  let hash = {};
  for (let item of array) {
    let value = item[key];
    hash[value] = hash[value] || [];
    hash[value].push(item);
  }
  return hash;
}

export function compact(obj) {
  for (let key in obj) {
    if (!obj[key]) {
      delete obj[key];
    }
  }
  return obj;
}
