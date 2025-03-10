export type StringifyOptions = {
  /**
   * Replacer function that works just like the one in JSON.stringify.
   * 
   * This only acts as the replacer ***function***, not the array of property
   * names that JSON.stringify also accepts.
   * @param this The parent object or array of the value.
   * @param key The name of the property it is a value of.
   * @param value A value in the JSON structure.
   * @returns A new value to replace the original in the JSON.
   */
  replace?: (this: any, key: string, value: any) => any
  /**
   * Either the string to use as the indent, or the number of spaces to use as
   * it.
   * 
   * Defaults to `2`.
   */
  indent?: string | number
  /**
   * A function that determines if an array or object is allowed to be inlined.
   * The other rules still apply, but this function can be used to stop certain
   * values from being inlined.
   * @param this The parent object or array of the value.
   * @param key The name of the property it is a value of.
   * @param value An array or object in the JSON structure.
   * @returns `true` if the array or object is allowed to be inlined,
   * `false` otherwise.
   */
  allowInline?: (this: any, key: string, value: any) => boolean
  /**
   * The maximum total length of a line, **not including indentation**.
   * 
   * Defaults to `100`.
   */
  maxLineLength?: number
  /**
   * The maximum number of items in inline arrays. Arrays exceeding this limit
   * will be split into multiple lines.
   * 
   * Defaults to `6`.
   */
  maxArrayItems?: number
  /**
   * The maximum number of properties in inline objects. Objects exceeding this
   * limit will be split into multiple lines.
   * 
   * Defaults to `6`.
   */
  maxObjectProperties?: number
  /**
   * The maximum length of items in inline arrays. Arrays containing items that
   * exceed this limit will be split into multiple lines.
   * 
   * Defaults to half of {@link StringifyOptions.maxLineLength maxLineLength}.
   */
  maxArrayItemLength?: number
  /**
   * Controls if long arrays should be made more compact or not. Compact long
   * arrays will try to fit items into a roughly square shape.
   * 
   * Defaults to `true`.
   */
  compactLongArrays?: boolean
  /**
   * A function that determines if an array or object is allowed to be
   * formatted as a table. The other rules still apply, but this function can
   * be used to stop certain values from being turned into tables.
   * @param this The parent object or array of the value.
   * @param key The name of the property it is a value of.
   * @param value An array or object in the JSON structure.
   * @returns `true` if the array or object is allowed to be formatted as a
   * table, `false` otherwise.
   */
  allowTable?: (this: any, key: string, value: any) => boolean
  /**
   * Controls if arrays and objects should be formatted like tables if the
   * structure of their contents allow it.
   * 
   * Defaults to `true`.
   */
  tables?: boolean
  /**
   * Controls if arrays should be formatted like tables if the structure of
   * their contents allow it. Requires {@link StringifyOptions.tables tables}
   * to be enabled.
   * 
   * Defaults to `true`.
   */
  tableArrays?: boolean
  /**
   * Controls if objects should be formatted like tables if the structure of
   * their contents allow it. Requires {@link StringifyOptions.tables tables}
   * to be enabled.
   * 
   * Defaults to `true`.
   */
  tableObjects?: boolean
  /**
   * For an array or object that contains objects to be formatted as a table,
   * the contained objects require this many shared keys that exist in all of
   * them. If there are fewer than this amount of shared keys between the
   * contained objects, the parent array or object will not be formatted as a
   * table.
   * 
   * Defaults to `1`.
   */
  tableMinSharedKeys?: number
  /**
   * Controls if the ends of rows in a table should be padded such that the
   * closing brackets all line up or not. If disabled, the closing brackets
   * will be placed after the last filled column in each row instead.
   * 
   * Defaults to `true`.
   */
  tablePadEndOfRows?: boolean
  /**
   * Align numbers in tables such that the decimal point is always in the same
   * column. This makes it easier to see the difference between large numbers
   * vs. precise ones, for example `10000` vs `0.0001`.
   * 
   * Defaults to `true`.
   */
  tableDecimalAlignment?: boolean
}

/**
 * Converts a JavaScript value to a JSON string. Similar to `JSON.stringify`,
 * but with more options and defaults tuned to produce results that are easier
 * to read for humans.
 * 
 * @param value - The value to convert to a JSON string.
 * @param options - An optional object containing formatting options.
 * @returns The formatted JSON string representation of the value.
 */
function stringify(value: undefined | Function, options?: StringifyOptions): undefined
function stringify(value: Exclude<unknown, undefined | Function>, options?: StringifyOptions): string
function stringify(value: any, options?: StringifyOptions): string | undefined {
  const maxLineLength = options?.maxLineLength ?? 100
  const maxArrayItems = options?.maxArrayItems ?? 6
  const maxObjectProperties = options?.maxObjectProperties ?? 6
  const maxArrayItemLength = options?.maxArrayItemLength ?? maxLineLength / 2
  const compactLongArrays = options?.compactLongArrays ?? true

  const tables = options?.tables ?? true
  const tableArrays = tables && (options?.tableArrays ?? true)
  const tableObjects = tables && (options?.tableObjects ?? true)
  const tableMinSharedKeys = options?.tableMinSharedKeys ?? 1
  const tablePadEndOfRows = options?.tablePadEndOfRows ?? true
  const tableDecimalAlignment = options?.tableDecimalAlignment ?? true

  const indent =
    options?.indent === null ? '' :
    typeof options?.indent === 'number' ? ' '.repeat(Math.max(0, Math.min(10, options.indent))) :
    typeof options?.indent === 'string' ? options.indent.slice(0, 10) :
    '  '
  if (indent.length === 0) {
    return JSON.stringify(value, options?.replace)
  }

  if (options && 'replace' in options && typeof options.replace !== 'function') {
    throw new Error(`'replace' must be a function.`)
  }
  if (options && 'allowInline' in options && typeof options.allowInline !== 'function') {
    throw new Error(`'allowInline' must be a function.`)
  }
  if (options && 'allowTable' in options && typeof options.allowTable !== 'function') {
    throw new Error(`'allowTable' must be a function.`)
  }
  const replaceFunc = options?.replace
  const allowInline = options?.allowInline
  const allowTable = options?.allowTable

  function processValue(
    key: string,
    val: any,
    depth: number,
    parentObj: any,
    keyLength: number = 0,
    allowTables: boolean = true
  ): {
    result: string | undefined
    nested: boolean
  } {
    if (replaceFunc) val = replaceFunc.bind(parentObj)(key, val)

    if (val === null) return {
      result: 'null',
      nested: false
    }

    if (typeof val === 'string' || typeof val === 'number' || typeof val === 'bigint') return {
      result: JSON.stringify(val),
      nested: false
    }

    if (typeof val === 'boolean') return {
      result: val ? 'true' : 'false',
      nested: false
    }

    if (typeof val === 'object' && typeof val.toJSON === 'function') {
      return processValue(key, val.toJSON(), depth, parentObj, keyLength)
    }

    if (Array.isArray(val)) {
      if (tableArrays && allowTables && (allowTable === undefined || allowTable.bind(parentObj)(key, val))) {
        const rval = replaceFunc ? replaceArrayItems(val) : val
        const columnOrder = getTableColumnOrder(rval, maxObjectProperties, tableMinSharedKeys)
        if (columnOrder !== null) {
          const items = Array.isArray(rval[0]) ?
            tableOfArrays(rval, columnOrder.length) :
            tableOfObjects(rval, columnOrder)
          if (items !== null && items.every(e => e.length <= maxLineLength)) {
            return {
              result: formatArray(items, depth, true, keyLength),
              nested: true
            }
          }
        }
      }

      let nested = false
      let multipleNestedItems = false
      const items = val.map((item, i) => {
        const processed = processValue(String(i), item, depth + 1, val)
        multipleNestedItems ||= nested && typeof item === 'object'
        nested ||= typeof item === 'object'
        return processed.result ?? 'null'
      })
      return {
        result: formatArray(
          items,
          depth,
          multipleNestedItems,
          keyLength,
          allowInline === undefined || allowInline.bind(parentObj)(key, val)
        ),
        nested
      }
    }

    if (typeof val === 'object') {
      const keys = Object.keys(val).filter(k => typeof val[k] !== 'undefined' && typeof val[k] !== 'function')
      table:
      if (tableObjects && allowTables && (allowTable === undefined || allowTable.bind(parentObj)(key, val))) {
        const rval = replaceFunc ? replaceObjectProperties(val, keys) : val
        const columnOrder = getTableColumnOrder(rval, maxObjectProperties, tableMinSharedKeys)
        if (columnOrder !== null) {
          const isArray = Array.isArray(rval[keys[0]])
          if (columnOrder.length > (isArray ? maxArrayItems : maxObjectProperties)) return null

          const jsonKeys = keys.map(k => JSON.stringify(k))
          const keyColumnWidth = arrMax(jsonKeys.map(k => k.length)) + 1
          const items = isArray ?
            tableOfArrays(Object.values(rval), columnOrder.length) :
            tableOfObjects(Object.values(rval), columnOrder)
          if (items === null) break table

          for (let i = 0; i < items.length; i++) {
            items[i] = jsonKeys[i] + ':' + ' '.repeat(keyColumnWidth - jsonKeys[i].length) + items[i]
          }
          if (items.some(e => e.length > maxLineLength)) break table

          return {
            result: formatObject(items, depth, true, keyLength),
            nested: true
          }
        }
      }

      let nested = false
      let nestedItems = false
      const items = keys.map(k => {
        const keyString = JSON.stringify(k) + ': '
        const processed = processValue(k, val[k], depth + 1, val, keyString.length)
        nested ||= typeof val[k] === 'object'
        nestedItems ||= processed.nested
        return processed.result !== undefined ? keyString + processed.result : undefined
      }).filter(x => x !== undefined)
  
      return {
        result: formatObject(
          items, 
          depth, 
          nestedItems, 
          keyLength,
          allowInline === undefined || allowInline.bind(parentObj)(key, val)
        ),
        nested
      }
    }
  }

  function replaceObjectProperties(val: Record<string, any>, keys: string[]): Record<string, any> {
    const result: Record<string, any> = {}
    const replace = replaceFunc.bind(val)
    for (let i = 0; i < keys.length; i++) {
      const k = keys[i]
      result[k] = replace(k, val[k])
    }
    return result
  }

  function replaceArrayItems(val: any[]): any[] {
    const result: any[] = []
    const replace = replaceFunc.bind(val)
    for (let i = 0; i < val.length; i++) {
      result[i] = replace(String(i), val[i])
    }
    return result
  }

  function tableOfArrays(rowArrs: any[][], columnCount: number): string[] | null {
    const columns: any[][] = []
    const columnWidths: number[] = []
    for (let i = 0; i < columnCount; i++) {
      const column = rowArrs.map(e => e?.[i])
      const subcolumnOrder = getTableColumnOrder(column, maxObjectProperties, tableMinSharedKeys)
      if (subcolumnOrder !== null) {
        const isArray = Array.isArray(column.find(e => e !== undefined))
        if (subcolumnOrder.length > (isArray ? maxArrayItems : maxObjectProperties)) return null
        const subtable = isArray ?
          tableOfArrays(column, subcolumnOrder.length) :
          tableOfObjects(column, subcolumnOrder)
        if (subtable !== null) {
          // Subtable
          columnWidths[i] = subtable[0].length
          columns[i] = subtable
          continue
        }
      }
      // Not a subtable
      columns[i] = []
      let numeric = true
      for (let j = 0; j < column.length; j++) {
        const v = column[j]
        if (v === undefined) continue
        const s = processValue(String(i), v, 0, rowArrs, 0, false).result
        const sl = s.length
        if (sl > maxLineLength || s.includes('\n')) return null
        columnWidths[i] = Math.max(columnWidths[i] ?? 0, sl)
        columns[i][j] = s
        numeric &&= !Number.isNaN(Number(s))
      }
      if (tableDecimalAlignment && numeric) {
        columns[i] = decimalAlignment(columns[i])
      }
    }

    const table: string[] = []
    for (let i = 0; i < rowArrs.length; i++) {
      if (rowArrs[i] === undefined) {
        table.push('')
        continue
      }
      let row = '[ '
      const lastFilledColumn = rowArrs[i].length - 1
      const end = tablePadEndOfRows ? columnCount : lastFilledColumn + 1
      for (let columnIndex = 0; columnIndex < end; columnIndex++) {
        if (columns[columnIndex][i] === undefined) {
          row += ' '.repeat(columnWidths[columnIndex] + 2)
          continue
        }
        row += columns[columnIndex][i]
          + (columnIndex !== lastFilledColumn ? ',' : '')
          + ' '.repeat(columnWidths[columnIndex] - columns[columnIndex][i].length + 1)
      }
      table.push(row + ']')
    }
    return table
  }

  function tableOfObjects(rowObjs: any[], columnOrder: string[]): string[] | null {
    const columns: Record<string, any[]> = {}
    const columnWidths: Record<string, number> = {}
    for (let i = 0; i < columnOrder.length; i++) {
      const columnKey = columnOrder[i]
      const jsonKey = JSON.stringify(columnKey)
      const column = rowObjs.map(e => e?.[columnKey])
      const subcolumnOrder = getTableColumnOrder(column, maxObjectProperties, tableMinSharedKeys)
      if (subcolumnOrder !== null) {
        const isArray = Array.isArray(column.find(e => e !== undefined))
        if (subcolumnOrder.length > (isArray ? maxArrayItems : maxObjectProperties)) return null
        const subtable = isArray ?
          tableOfArrays(column, subcolumnOrder.length) :
          tableOfObjects(column, subcolumnOrder)
        if (subtable !== null) {
          // Subtable
          for (let j = 0; j < subtable.length; j++) {
            subtable[j] = jsonKey + ': ' + subtable[j]
          }
          columnWidths[columnKey] = subtable[0].length
          columns[columnKey] = subtable
          continue
        }
      }
      // Not a subtable
      columns[columnKey] = []
      const rowCount = column.length
      if (tableDecimalAlignment) {
        let numeric = true
        for (let j = 0; j < rowCount; j++) {
          const v = column[j]
          if (v === undefined) continue
          const s = processValue(columnKey, v, 0, rowObjs, 0, false).result
          if (s.includes('\n')) return null
          columns[columnKey][j] = s
          numeric &&= !Number.isNaN(Number(s))
        }
        if (numeric) {
          columns[columnKey] = decimalAlignment(columns[columnKey])
        }
        for (let j = 0; j < rowCount; j++) {
          if (column[j] === undefined) continue
          const s = jsonKey + ': ' + columns[columnKey][j]
          const sl = s.length
          if (sl > maxLineLength) return null
          columnWidths[columnKey] = Math.max(columnWidths[columnKey] ?? 0, sl)
          columns[columnKey][j] = s
        }

      } else { // tableDecimalAlignment is false
        for (let j = 0; j < column.length; j++) {
          const v = column[j]
          if (v === undefined) continue
          const s = jsonKey + ': ' + processValue(columnKey, v, 0, rowObjs, 0, false).result
          const sl = s.length
          if (sl > maxLineLength || s.includes('\n')) return null
          columnWidths[columnKey] = Math.max(columnWidths[columnKey] ?? 0, sl)
          columns[columnKey][j] = s
        }
      }
    }

    const table: string[] = []
    for (let i = 0; i < rowObjs.length; i++) {
      if (rowObjs[i] === undefined) {
        table.push('')
        continue
      }
      let row = '{ '
      const lastFilledColumn = columnOrder.findLastIndex(e => e in rowObjs[i])
      const end = tablePadEndOfRows ? columnOrder.length : lastFilledColumn + 1
      for (let columnIndex = 0; columnIndex < end; columnIndex++) {
        const columnKey = columnOrder[columnIndex]
        if (columns[columnKey][i] === undefined) {
          row += ' '.repeat(columnWidths[columnKey] + 2)
          continue
        }
        row += columns[columnKey][i]
          + (columnIndex !== lastFilledColumn ? ',' : '')
          + ' '.repeat(columnWidths[columnKey] - columns[columnKey][i].length + 1)
      }
      table.push(row + '}')
    }
    return table
  }

  function formatArray(
    items: string[],
    depth: number,
    nestedItems: boolean,
    keyLength: number = 0,
    allowInline: boolean = true
  ): string {
    if (items.length === 0) return '[]'
    if (
      allowInline &&
      !nestedItems &&
      items.length <= maxArrayItems &&
      items.every(item => item.length <= maxArrayItemLength)
    ) {
      const line = '[ ' + items.join(', ') + ' ]'
      if (keyLength + line.length <= maxLineLength && !line.includes('\n')) {
        return line
      }
    }
    const arrIndent = indent.repeat(depth + 1)
    if (
      compactLongArrays &&
      items.length > maxArrayItems &&
      items.every(item => !item.includes('\n') && item[0] !== '[' && item[0] !== '{')
    ) {
      const itemLengths = items.map(item => item.length)
      const min = arrMin(itemLengths)
      const max = arrMax(itemLengths)
      const mean = sum(itemLengths) / items.length
      if ((max - min) < Math.max(4, mean * 0.25)) {
        const [ itemsWide, columnWidths ] = findMaxItemsWide(items, itemLengths, maxLineLength)
        return '[\n' + arrIndent + Array(Math.ceil(items.length / itemsWide)).fill(null).map((_, i) => {
          return joinColumns(items.slice(i * itemsWide, (i + 1) * itemsWide), columnWidths)
        }).join(',\n' + arrIndent) + '\n' + indent.repeat(depth) + ']'
      }
    }
    return '[\n' + arrIndent + items.join(',\n' + arrIndent) + '\n' + indent.repeat(depth) + ']'
  }

  function formatObject(
    items: string[],
    depth: number,
    nestedItems: boolean,
    keyLength: number = 0,
    allowInline: boolean = true
  ): string {
    if (items.length === 0) return '{}'
    if (allowInline && !nestedItems && items.length <= maxObjectProperties) {
      const line = '{ ' + items.join(', ') + ' }'
      if (keyLength + line.length <= maxLineLength && !line.includes('\n')) {
        return line
      }
    }
    const objIndent = indent.repeat(depth + 1)
    return '{\n' + objIndent + items.join(',\n' + objIndent) + '\n' + indent.repeat(depth) + '}'
  }

  return processValue('', value, 0, { '': value })?.result
}

function sum(ns: number[]): number {
  let sum = 0
  for (let i = 0; i < ns.length; i++) {
    sum += ns[i]
  }
  return sum
}

function arrMin(ns: number[]): number {
  let m = ns[0]
  for (let i = 1; i < ns.length; i++) {
    m = Math.min(m, ns[i])
  }
  return m
}

function arrMax(ns: number[]): number {
  let m = ns[0]
  for (let i = 1; i < ns.length; i++) {
    m = Math.max(m, ns[i])
  }
  return m
}

function getColumnWidths(lengths: number[], columnCount: number): number[] {
  const columns = Map.groupBy(lengths, (_, i) => i % columnCount)
  return Array.from(columns).map(([_, ls]) => Math.max(...ls))
}

function joinColumns(items: string[], columnWidths: number[]): string {
  let line = items[0]
  for (let i = 1; i < items.length; i++) {
    line += ',' + ' '.repeat(columnWidths[i - 1] - items[i - 1].length + 1) + items[i]
  }
  return line
}

function findMaxItemsWide(items: any[], itemLengths: number[], maxLineLength: number): [number, number[]] {
  let low = 1
  let high = Math.ceil(Math.sqrt(items.length))
  let best = low
  let bestColumnWidths: number[]
  while (low <= high) {
    const mid = Math.floor((low + high) / 2)
    const columnWidths = getColumnWidths(itemLengths, mid)
    const totalWidth = sum(columnWidths) + (mid - 1) * 2
    if (totalWidth <= maxLineLength) {
      best = mid
      bestColumnWidths = columnWidths
      low = mid + 1
    } else {
      high = mid - 1
    }
  }
  bestColumnWidths ??= getColumnWidths(itemLengths, best)
  return [ best, bestColumnWidths ]
}

function anyCommon(a: Set<any>, b: Set<any>): boolean {
  for (const i of a) {
    if (b.has(i)) return true
  }
  return false
}

function getTableColumnOrder(
  table: unknown,
  maxObjectProperties: number,
  tableMinSharedKeys: number
): string[] | null {
  if (table === null || typeof table !== 'object') return null

  const values = (Array.isArray(table) ? table : Object.values(table))
    .filter(el => typeof el !== 'undefined' && typeof el !== 'function')

  if (values.length <= 1) return null

  if (Array.isArray(values[0])) {
    const length = values[0].length
    return values.every(el => Array.isArray(el) && el.length === length) ?
      Array(length).fill(null).map((_, i) => String(i)) :
      null
  }

  if (values.some(v => typeof v !== 'object' || v === null)) return null

  const keys = values.map(v => Object.keys(v))
  if (keys.some(ik => ik.length > maxObjectProperties)) return null

  const allKeys = Array.from(new Set(keys.flat()))
  const sharedKeys = allKeys.filter(key => values.every(v => key in v))
  if (sharedKeys.length < Math.min(tableMinSharedKeys, allKeys.length)) {
    return null
  }

  const keyPositions: Record<string, { before: Set<string>, after: Set<string> }> = Object.fromEntries(
    allKeys.map(k => [k, { before: new Set(), after: new Set() }])
  )
  for (let i = 0; i < values.length; i++) {
    const itemKeys = keys[i]
    for (let j = 1; j < allKeys.length; j++) {
      const key = allKeys[j]
      const index = itemKeys.indexOf(key)
      if (index < 0) continue

      const { before, after } = keyPositions[key]
      for (let k = 0; k < index; k++) {
        before.add(itemKeys[k])
      }
      for (let k = index + 1; k < itemKeys.length; k++) {
        after.add(itemKeys[k])
      }
    }
  }
  if (Object.values(keyPositions).some(kp => anyCommon(kp.before, kp.after))) return null

  return Object.entries(keyPositions).sort((a, b) => {
    return +a[1].before.has(b[0]) - +b[1].before.has(a[0]) + +b[1].after.has(a[0]) - +a[1].after.has(b[0])
  }).map(e => e[0])
}

function decimalAlignment(numbers: string[]): string[] {
  let maxDecimalIndex = 0
  const decimalIndices = []
  for (let i = 0; i < numbers.length; i++) {
    const n = numbers[i]
    if (n === undefined) continue
    const d = n.indexOf('.')
    if (d > 0) {
      maxDecimalIndex = Math.max(maxDecimalIndex, d)
      decimalIndices[i] = d
    } else {
      maxDecimalIndex = Math.max(maxDecimalIndex, n.length)
      decimalIndices[i] = n.length
    }
  }

  const aligned = []
  for (let i = 0; i < numbers.length; i++) {
    const n = numbers[i]
    if (n === undefined) continue
    const d = decimalIndices[i]
    aligned[i] = ' '.repeat(maxDecimalIndex - d) + n
  }
  return aligned
}

export default stringify
