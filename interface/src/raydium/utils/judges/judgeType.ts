const isString = (v: unknown): v is string => typeof v === 'string'

const isArray = Array.isArray

function isFunction(value: unknown): value is (...args: any[]) => any {
  return typeof value === 'function'
}

export function isObject(val: unknown): val is Record<string | number, any> | Array<any> {
  return !(val === null) && typeof val === 'object'
}

function isEmptyObject(obj: any): boolean {
  return (isArray(obj) && obj.length === 0) || (isObject(obj) && Object.keys(obj).length === 0)
}

function isUndefined(val: unknown): val is undefined {
  return val === undefined
}

/**
 * @example
 * notNullish('') // true
 * notNullish(undefined) // false
 * notNullish([]) // true
 */
function notNullish<T>(value: T): value is NonNullable<T> {
  return value !== undefined && value !== null
}
function isNullish(value: any): value is undefined | null {
  return !notNullish(value)
}

const isExist = notNullish

const notExist = isNullish
