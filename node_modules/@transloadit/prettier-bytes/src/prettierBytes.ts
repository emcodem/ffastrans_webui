// Adapted from https://github.com/Flet/prettier-bytes/
// Changing 1000 bytes to 1024, so we can keep uppercase KB vs kB
// ISC License (c) Dan Flettre https://github.com/Flet/prettier-bytes/blob/master/LICENSE
export = function prettierBytes(input: number): string {
  if (typeof input !== 'number' || Number.isNaN(input)) {
    throw new TypeError(`Expected a number, got ${typeof input}`)
  }

  const neg = input < 0
  let num = Math.abs(input)

  if (neg) {
    num = -num
  }

  if (num === 0) {
    return '0 B'
  }

  const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
  const exponent = Math.min(Math.floor(Math.log(num) / Math.log(1024)), units.length - 1)
  const value = Number(num / 1024 ** exponent)
  const unit = units[exponent]

  return `${value >= 10 || value % 1 === 0 ? Math.round(value) : value.toFixed(1)} ${unit}`
}
