export function onLine() {
  Object.defineProperty(window.navigator, 'onLine', { value: true });
}

export function offLine() {
  Object.defineProperty(window.navigator, 'onLine', { value: false });
}
