import { expect, test } from 'vitest'
import dedent from 'dedent'

import stringify from './index.ts'

test('undefined results in undefined', () => {
  expect(stringify(undefined)).toBe(undefined)
})

test('function results in undefined', () => {
  expect(stringify(() => null)).toBe(undefined)
})

test('null results in "null"', () => {
  expect(stringify(null)).toBe('null')
})

test('string results in JSON string', () => {
  expect(stringify('hello')).toBe('"hello"')
})

test('number results in JSON string', () => {
  expect(stringify(123)).toBe('123')
})

test('boolean results in JSON string', () => {
  expect(stringify(true)).toBe('true')
  expect(stringify(false)).toBe('false')
})

test('array results in formatted JSON string', () => {
  expect(stringify([1, 'two', null, true])).toBe('[ 1, "two", null, true ]')
})

test('object results in formatted JSON string', () => {
  const obj = { a: 1, b: 'two', c: null, d: true }
  expect(stringify(obj)).toBe('{ "a": 1, "b": "two", "c": null, "d": true }')
})

test('nested object results in formatted JSON string', () => {
  const obj = { a: { b: { c: 1 } } }
  expect(stringify(obj)).toBe(dedent`
    {
      "a": { "b": { "c": 1 } }
    }
  `)
})

test('array with objects results in formatted JSON string', () => {
  const arr = [{ a: 1 }, { b: 2 }]
  expect(stringify(arr)).toBe(dedent`
    [
      { "a": 1 },
      { "b": 2 }
    ]
  `)
})

test('object with array results in formatted JSON string', () => {
  const obj = { a: [1, 2, 3] }
  expect(stringify(obj)).toBe('{ "a": [ 1, 2, 3 ] }')
})

test('replace', () => {
  const replace = (key: string, value: any) => (typeof value === 'number' ? value * 2 : value)
  const obj = { a: 1, b: 2 }
  expect(stringify(obj, { replace })).toBe('{ "a": 2, "b": 4 }')
})

test('indent', () => {
  const obj = { a: 1, b: 2 }
  expect(stringify(obj, { maxLineLength: 0, indent: 2 })).toBe('{\n  "a": 1,\n  "b": 2\n}')
  expect(stringify(obj, { maxLineLength: 0, indent: 4 })).toBe('{\n    "a": 1,\n    "b": 2\n}')
  expect(stringify(obj, { maxLineLength: 0, indent: '\t' })).toBe('{\n\t"a": 1,\n\t"b": 2\n}')
})

test('maxArrayItems', () => {
  const array1 = [1]
  const array2 = [1, 2, 3]
  const array3 = [1, 2, 3, 4, 5]
  expect(stringify(array1, {
    maxArrayItems: 3
  })).toBe('[ 1 ]')
  expect(stringify(array2, {
    maxArrayItems: 3
  })).toBe('[ 1, 2, 3 ]')
  expect(stringify(array3, {
    maxArrayItems: 3,
    compactLongArrays: false,
  })).toBe(dedent`
    [
      1,
      2,
      3,
      4,
      5
    ]
  `)
  expect(stringify(array3, {
    maxArrayItems: 5
  })).toBe('[ 1, 2, 3, 4, 5 ]')
})

test('nested objects/arrays split into multiple lines if nested more than one level deep', () => {
  const nestedArray = [[1, 2], [3, 4]]
  expect(stringify(nestedArray)).toBe(dedent`
    [
      [ 1, 2 ],
      [ 3, 4 ]
    ]
  `)

  const nestedObject = { a: { b: { c: 1 } }, d: 2 }
  expect(stringify(nestedObject)).toBe(dedent`
    {
      "a": { "b": { "c": 1 } },
      "d": 2
    }
  `)

  const complexObject = { a: [1, { b: 2 }], c: 3 }
  expect(stringify(complexObject)).toBe(dedent`
    {
      "a": [ 1, { "b": 2 } ],
      "c": 3
    }
  `)
})

test('property name lengths affect splitting', () => {
  const obj = {
    a: { b: 1 },
    ccccccccccccccccccccccccccc: { d: 1 }
  }
  expect(stringify(obj, {
    maxLineLength: 40
  })).toBe(dedent`
    {
      "a": { "b": 1 },
      "ccccccccccccccccccccccccccc": {
        "d": 1
      }
    }
  `)
})

test('compactLongArrays', () => {
  const obj = {
    numbers: [
      1,  2,  3,  4,  5,  6,
      7,  8,  9,  10, 11, 12,
      13, 14, 15, 16, 17, 18,
      19, 20, 21, 22, 23, 24,
      25, 26
    ],
    short_strings: [
      'a', 'b', 'c', 'd',
      'e', 'f', 'g', 'h',
      'i', 'j', 'k', 'l',
      'm'
    ],
    medium_strings: [
      'abcdefghijklm',
      'abcdefghijklm',
      'abcdefghijklm',
      'abcdefghijklm',
      'abcdefghijklm',
      'abcdefghijklm',
      'abcdefghijklm',
      'abcdefghijklm',
      'abcdefghijklm',
      'abcdefghijklm'
    ]
  }
  expect(stringify(obj, {
    maxLineLength: 40
  })).toBe(dedent`
    {
      "numbers": [
        1,  2,  3,  4,  5,  6,
        7,  8,  9,  10, 11, 12,
        13, 14, 15, 16, 17, 18,
        19, 20, 21, 22, 23, 24,
        25, 26
      ],
      "short_strings": [
        "a", "b", "c", "d",
        "e", "f", "g", "h",
        "i", "j", "k", "l",
        "m"
      ],
      "medium_strings": [
        "abcdefghijklm", "abcdefghijklm",
        "abcdefghijklm", "abcdefghijklm",
        "abcdefghijklm", "abcdefghijklm",
        "abcdefghijklm", "abcdefghijklm",
        "abcdefghijklm", "abcdefghijklm"
      ]
    }
  `)
})

test('tables', () => {
  const obj = {
    down:  { uv: [ 13, 4, 15,  6 ], texture: '#bottom' },
    up:    { uv: [ 13, 0, 15,  2 ], texture: '#top'    },
    north: { uv: [  9, 0, 11, 16 ], texture: '#side'   },
    south: { uv: [  9, 0, 11, 16 ], texture: '#side'   },
    west:  { uv: [  9, 0, 11, 16 ], texture: '#side'   },
    east:  { uv: [  9, 0, 11, 16 ], texture: '#side'   }
  }
  expect(stringify(obj)).toBe(dedent`
    {
      "down":  { "uv": [ 13, 4, 15,  6 ], "texture": "#bottom" },
      "up":    { "uv": [ 13, 0, 15,  2 ], "texture": "#top"    },
      "north": { "uv": [  9, 0, 11, 16 ], "texture": "#side"   },
      "south": { "uv": [  9, 0, 11, 16 ], "texture": "#side"   },
      "west":  { "uv": [  9, 0, 11, 16 ], "texture": "#side"   },
      "east":  { "uv": [  9, 0, 11, 16 ], "texture": "#side"   }
    }
  `)
})

test('tables with missing properties', () => {
  const obj = {
    a: { type: 35, rotation: [  0, 130, 0 ] },
    b: { type: 35                           },
    c: { type: 35                           },
    d: { type: 35, rotation: [ 90,   0, 0 ] },
    e: { type: 35                           }
  }
  expect(stringify(obj)).toBe(dedent`
    {
      "a": { "type": 35, "rotation": [  0, 130, 0 ] },
      "b": { "type": 35                             },
      "c": { "type": 35                             },
      "d": { "type": 35, "rotation": [ 90,   0, 0 ] },
      "e": { "type": 35                             }
    }
  `)
})
