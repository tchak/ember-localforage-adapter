export function onLine() {
  try {
    Object.defineProperty(window.navigator, 'onLine', { value: true });
  } catch(e) {
    Object.defineProperty(window, 'navigator', { value: onLineNavigator });
  }
}

export function offLine() {
  try {
    Object.defineProperty(window.navigator, 'onLine', { value: false });
  } catch(e) {
    Object.defineProperty(window, 'navigator', { value: offLineNavigator });
  }
}

const onLineNavigator = Object.freeze({
  onLine: true
});

const offLineNavigator = Object.freeze({
  onLine: false
});
