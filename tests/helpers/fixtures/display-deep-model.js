export default {
  'purchase': {
    '1': {
      id: '1',
      type: 'purchase',
      attributes: {
        name: 'credits',
        amount: 10
      },
      relationships: {
        ledger: {
          data: {
            id: '1',
            type: 'ledger'
          }
        },
        player: {
          data:{
            id: '1',
            type: 'player'
          }
        }
      }
    }
  },

  'ledger': {
    '1': {
      id: '1',
      type: 'ledger',
      attributes: {
        title: 'payable'
      },
      relationships: {
        players: {
          data: [
            {
              id: '1',
              type: 'player'
            }
          ]
        },
        purchases: {
          data: [
            {
              id: '1',
              type: 'purchase'
            }
          ]
        }
      }
    }
  },

  'player': {
    '1': {
      id: '1',
      type: 'player',
      attributes: {
        name: 'one',
        balance: -10
      },
      relationships: {
        ledger: {
          data: {
            id: '1',
            type: 'ledger'
          }
        },
        purchases: {
          data: [
            {
              id: '1',
              type: 'purchase'
            }
          ]
        }
      }
    }
  }
};
