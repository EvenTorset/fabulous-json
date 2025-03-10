import { bench, describe } from 'vitest'

import stringify from './index.ts'

describe('vs JSON.stringify', () => {
  const obj = {
    down:  { uv: [ 13, 4, 15,  6 ], texture: '#bottom' },
    up:    { uv: [ 13, 0, 15,  2 ], texture: '#top'    },
    north: { uv: [  9, 0, 11, 16 ], texture: '#side'   },
    south: { uv: [  9, 0, 11, 16 ], texture: '#side'   },
    west:  { uv: [  9, 0, 11, 16 ], texture: '#side'   },
    east:  { uv: [  9, 0, 11, 16 ], texture: '#side'   }
  }
  bench('JSON.stringify', () => {
    JSON.stringify(obj, null, 2)
  })
  bench('stringify', () => {
    stringify(obj)
  })
  bench('stringify without tables', () => {
    stringify(obj, { tables: false })
  })
})

describe('shallow vs deep structures', () => {
  const shallowObj = {
    a: {},
    b: {},
    c: {},
    d: {},
    e: {},
    f: {},
    g: {},
    h: {},
    i: {},
    j: {},
    k: {},
    l: {},
    m: {},
    n: {},
    o: {},
    p: {},
    q: {},
    r: {},
    s: {},
    t: 20,
    u: 'ABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQRSTUVWXYZ'
  }

  const deepObj = {
    a: {
      b: {
        c: {
          d: {
            e: {
              f: {
                g: {
                  h: {
                    i: {
                      j: {
                        k: {
                          l: {
                            m: {
                              n: {
                                o: {
                                  p: {
                                    q: {
                                      r: {
                                        s: {
                                          t: 20,
                                          u: 'ABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQRSTUVWXYZ'
                                        }
                                      }
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  bench('shallow', () => {
    stringify(shallowObj)
  })
  bench('deep', () => {
    stringify(deepObj)
  })
  bench('shallow without tables', () => {
    stringify(shallowObj, { tables: false })
  })
  bench('deep without tables', () => {
    stringify(deepObj, { tables: false })
  })
})
