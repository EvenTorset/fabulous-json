# fabulous-json
Yet another JSON stringifier that outputs fabulous-looking JSON strings.

## Installation
```
npm i fabulous-json
```

## Usage

```javascript
import stringify from 'fabulous-json'

const obj = { a: 'Hello world!', b: [ 1, 2, 3, 4 ] }

const jsonString = stringify(obj, { maxLineLength: 80 })
```

## Output Example
This example shows how arrays and objects can be inlined, and how they can form tables with property keys and values in columns:
```json
{
  "color": [ 1, 0.4, 0.2, 1 ],
  "brightness": {
    "function": "Linear",
    "loop": false,
    "keyframes": [
      { "position": 0,   "value":  12.8 },
      { "position": 0.1, "value": 102.4 },
      { "position": 0.2, "value":  51.2 },
      { "position": 1,   "value":   0   }
    ]
  }
}
```

## Options

### replace
Replacer function that works just like the one in JSON.stringify. This only acts as the replacer function, not the array of property names that JSON.stringify also accepts.

### indent
Either the string to use as the indent, or the number of spaces to use as it.

Defaults to `2`.

### prefixIndent
Either a string to add to the start of indented lines, or a number of spaces to add instead. This can be useful for generating JSON strings that are going to be inserted into other indented text.

Defauls to `0`.

### allowInline
A function that determines if an array or object is allowed to be inlined. The other rules still apply, but this function can be used to stop certain values from being inlined.

### maxLineLength
The maximum total length of a line, not including indentation.

Defaults to `100`.

### maxArrayItems
The maximum number of items in inline arrays. Arrays exceeding this limit will be split into multiple lines.

Defaults to `6`.

### maxObjectProperties
The maximum number of properties in inline objects. Objects exceeding this limit will be split into multiple lines.

Defaults to `6`.

### maxArrayItemLength
The maximum length of items in inline arrays. Arrays containing items that exceed this limit will be split into multiple lines.

Defaults to half of `maxLineLength`.

### compactLongArrays
Controls if long arrays should be made more compact or not. Compact long arrays will try to fit items into a roughly square shape.

Defaults to `true`.

### tables
Controls if arrays and objects should be formatted like tables if the structure of their contents allow it.

Defaults to `true`.

### tableArrays
Controls if arrays should be formatted like tables if the structure of their contents allow it. Requires `tables` to be enabled.

Defaults to `true`.

### tableObjects
Controls if objects should be formatted like tables if the structure of their contents allow it. Requires `tables` to be enabled.

Defaults to `true`.

### allowTable
A function that determines if an array or object is allowed to be formatted as a table. The other rules still apply, but this function can be used to stop certain values from being turned into tables.

### tableMinSharedKeys
For an array or object that contains objects to be formatted as a table, the contained objects require this many shared keys that exist in all of them. If there are fewer than this amount of shared keys between the contained objects, the parent array or object will not be formatted as a table.

Defaults to `1`.

### tablePadEndOfRows
Controls if the ends of rows in a table should be padded such that the closing brackets all line up or not. If disabled, the closing brackets will be placed after the last filled column in each row instead.

Defaults to `true`.

### tableDecimalAlignment
Align numbers in tables such that the decimal point is always in the same column. This makes it easier to see the difference between large numbers vs. precise ones, for example `10000` vs `0.0001`.

Defaults to `true`.
