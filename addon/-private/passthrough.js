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
