import 'ember-offline-adapter/-store';
import 'ember-offline-adapter/-snapshot';

function initialize(application) {
  application.inject('adapter', 'fastboot', 'service:fastboot');
}

export default {
  name: 'ember-offline-adapter',
  initialize
};
