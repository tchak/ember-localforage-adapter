export { default as uuid } from './-private/uuid';
export { default as clone } from './-private/clone';

const proto = Object.prototype;
const gpo = Object.getPrototypeOf;

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

/**
 * @credits https://github.com/nickb1080/is-pojo
 * @param obj
 * @returns {boolean}
 */
export function isPojo(obj) {
  if (obj === null || typeof obj !== "object") {
    return false;
  }
  return gpo(obj) === proto;
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
