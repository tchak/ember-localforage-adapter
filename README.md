Ember Data Offline Adapter
================================

Store your ember application data in [Mozilla's localForage](https://github.com/mozilla/localForage).

"localForage is a JavaScript library that improves the offline experience of your web app by using asynchronous storage (via IndexedDB or WebSQL where available) with a simple, localStorage-like API."

It is supported by all major browsers, including mobile.

/!\ THIS IS VERY EARLY STAGE /!\

[![Build Status](https://travis-ci.org/tchak/ember-offline-adapter.png?branch=master)](https://travis-ci.org/tchak/ember-offline-adapter)
[![npm version](https://badge.fury.io/js/ember-offline-adapter.svg)](http://badge.fury.io/js/ember-offline-adapter)
[![Ember Observer Score](http://emberobserver.com/badges/ember-offline-adapter.svg)](http://emberobserver.com/addons/ember-offline-adapter)

Usage
-----

Install the addon using ember cli

```
ember install ember-offline-adapter
```

Initialize the adapter.

```js
//app/adapters/application.js
export { default } from 'ember-offline-adapter';
```

### Localforage Namespace

All of your application data lives on a single `localforage` key, it defaults to `ember-offline-store` but if you supply a `namespace` option it will add it there:

```js
//app/adapters/user.js
import OfflineAdapter from 'ember-offline-adapter';

export default OfflineAdapter.extend({
  namespace: 'v1.0'
});
```

### Cache

In order to reduce the number of getItem calls to localforage, the adapter will use a caching mechanism. To disable it, set caching to false.

```js
import OfflineAdapter from 'ember-offline-adapter';

export default OfflineAdapter.extend({
  caching: false
});
```

Support
----

The adapter is available in the current versions of all major browsers: Chrome, Firefox, IE, and Safari (including Safari Mobile). localStorage is used for browsers with no IndexedDB or WebSQL support. See [Mozilla's localForage](https://github.com/mozilla/localForage) for an updated detailed compatibility info.

* **Android Browser 2.1**
* **Blackberry 7**
* **Chrome 23** (Chrome 4.0+ with localStorage)
* **Chrome for Android 32**
* **Firefox 10** (Firefox 3.5+ with localStorage)
* **Firefox for Android 25**
* **Firefox OS 1.0**
* **IE 10** (IE 8+ with localStorage)
* **IE Mobile 10**
* **Opera 15** (Opera 10.5+ with localStorage)
* **Opera Mobile 11**
* **Phonegap/Apache Cordova 1.2.0**
* **Safari 3.1** (includes Mobile Safari)

Offline (Localforage) Adapter License & Copyright
--------------------------------------------------

Copyright (c) 2016 Paul Chavard
MIT Style license. http://opensource.org/licenses/MIT

Copyright (c) 2012 Genkgo BV
MIT Style license. http://opensource.org/licenses/MIT

Original LocalStorage Adapter
Copyright (c) 2012 Ryan Florence
MIT Style license. http://opensource.org/licenses/MIT
