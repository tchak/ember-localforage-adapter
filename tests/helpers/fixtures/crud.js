export default {
  'post': {
    'p1': {
      id: 'p1',
      type: 'post',
      attributes: {
        title: 'post #1'
      },
      relationships: {
        comments: {
          data: [
            { id: 'c1', type: 'comment' },
            { id: 'missingComment', type: 'comment' }
          ]
        },
        subscribers: {
          data: [
            { id: 'externalS1', type: 'subscriber' },
            { id: 'missingSubscriber', type: 'subscriber' }
          ]
        }
      }
    }
  },

  'comment': {
    'c1': {
      id: 'c1',
      type: 'comment',
      attributes: {
        title: 'comment #1'
      },
      relationships: {
        post: {
          data: { id: 'p1', type: 'post' }
        }
      }
    },
    'c2': {
      id: 'c2',
      type: 'comment',
      attributes: {
        title: 'comment #2'
      },
      relationships: {
        post: {
          data: { id: 'missingPost', type: 'post' }
        }
      }
    },
    'c3': {
      id: 'c3',
      type: 'comment',
      attributes: {
        title: 'comment #3'
      },
      relationships: {
        post: {
          data: { id: 'p1', type: 'post' }
        },
        author: {
          data: { id: 'externalA1', type: 'author' }
        }
      }
    },
    'c4': {
      id: 'c4',
      type: 'comment',
      attributes: {
        title: 'comment #3'
      },
      relationships: {
        post: {
          data: { id: 'p1', type: 'post' }
        },
        author: {
          data: { id: 'missingAuthor', type: 'author' }
        }
      }
    }
  },

  'list': {
    'l1': {
      id: 'l1',
      type: 'list',
      attributes: {
        name: 'one',
        b: true,
        day: 24
      },
      relationships: {
        items: {
          data: [
            { id: 'i1', type: 'item' },
            { id: 'i2', type: 'item' }
          ]
        }
      }
    },
    'l2': {
      id: 'l2',
      type: 'list',
      attributes: {
        name: 'two',
        b: false,
        day: 48
      },
      relationships: {
        items: {
          data: []
        }
      }
    },
    'l3': {
      id: 'l3',
      type: 'list',
      attributes: {
        name: 'three',
        b: false,
        day: 72
      },
      relationships: {
        items: {
          data: []
        }
      }
    }
  },

  'item': {
    'i1': {
      id: 'i1',
      type: 'item',
      attributes: {
        name: 'one'
      },
      relationships: {
        list: {
          data: { id: 'l1', type: 'list' }
        }
      }
    },
    'i2': {
      id: 'i2',
      type: 'item',
      attributes: {
        name: 'two'
      },
      relationships: {
        list: {
          data: { id: 'l1', type: 'list' }
        }
      }
    }
  },

  'order': {
    'o1': {
      id: 'o1',
      type: 'order',
      attributes: {
        name: 'one',
        b: true
      },
      relationships: {
        hours: {
          data: [
            { id:'h1', type: 'hour' },
            { id:'h2', type: 'hour' }
          ]
        }
      }
    },
    'o2': {
      id: 'o2',
      type: 'order',
      attributes: {
        name: 'two',
        b: false
      },
      relationships:{
        hours: {
          data: []
        }
      }
    },
    'o3': {
      id: 'o3',
      type: 'order',
      attributes: {
        name: 'three',
        b: true
      },
      relationships: {
        hours: {
          data: [
            { id: 'h3', type: 'hour' },
            { id: 'h4', type: 'hour' }
          ]
        }
      }
    },
    'o4': {
      id: 'o4',
      type: 'order',
      attributes: {
        name: 'four',
        b: true
      },
      relationships: {
        hours: {
          data: []
        }
      }
    }
  },

  'hour': {
    'h1': {
      id: 'h1',
      type: 'hour',
      attributes: {
        name: 'one',
        amount: 4
      },
      relationships: {
        order: {
          data: { id: 'o1', type: 'order' }
        }
      }
    },
    'h2': {
      id: 'h2',
      type: 'hour',
      attributes: {
        name: 'two',
        amount: 3
      },
      relationships: {
        order: {
          data: {
            id: 'o1',
            type: 'order'
          }
        }
      }
    },
    'h3': {
      id: 'h3',
      type: 'hour',
      attributes: {
        name: 'three',
        amount: 2
      },
      relationships: {
        order: {
          data: {
            id: 'o3',
            type: 'order'
          }
        }
      }
    },
    'h4': {
      id: 'h4',
      type: 'hour',
      attributes: {
        name: 'four',
        amount: 1
      },
      relationships: {
        order: {
          data: { id: 'o3', type: 'order' }
        }
      }
    }
  }
};
