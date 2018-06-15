/*jshint node:true*/
module.exports = {
  scenarios: [
    // {
    //   name: 'ember-lts-2.4',
    //   bower: {
    //     dependencies: {
    //       'ember': 'components/ember#lts-2-4'
    //     },
    //     resolutions: {
    //       'ember': 'lts-2-4'
    //     }
    //   }
    // },
    // {
    //   name: 'ember-lts-2.8',
    //   bower: {
    //     dependencies: {
    //       'ember': 'components/ember#lts-2-8'
    //     },
    //     resolutions: {
    //       'ember': 'lts-2-8'
    //     }
    //   }
    // },
    {
      name: 'ember-release',
      npm: {
        devDependencies: {
          'ember-source': 'ember-source#release'
        }
      }
    },
    {
      name: 'ember-beta',
      npm: {
        devDependencies: {
          'ember': 'ember-source#beta'
        }
      }
    },
    {
      name: 'ember-canary',
      npm: {
        devDependencies: {
          'ember': 'ember-source#canary'
        }
      }
    }
  ]
};
