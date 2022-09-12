// Foreground Colors
const AD = '\u001b[0m' // ANSI Default
const A0 = '\u001b[30m' // ANSI Black
const AR = '\u001b[31m' // ANSI Red
const AG = '\u001b[32m' // ANSI Green
const AY = '\u001b[33m' // ANSI Yellow
const AB = '\u001b[34m' // ANSI Blue
const AM = '\u001b[35m' // ANSI Magenta
const AC = '\u001b[36m' // ANSI Cyan
const AW = '\u001b[37m' // ANSI White

// Background Colors
const BD = '\u001b[0m' // ANSI Default
const B0 = '\u001b[40m' // ANSI Black
const BR = '\u001b[41m' // ANSI Red
const BG = '\u001b[42m' // ANSI Green
const BY = '\u001b[43m' // ANSI Yellow
const BB = '\u001b[44m' // ANSI Blue
const BM = '\u001b[45m' // ANSI Magenta
const BC = '\u001b[46m' // ANSI Cyan
const BW = '\u001b[47m' // ANSI White

let memo = new Map()

function replacer (k, v) {
  try {
    if (typeof v === 'object') {
      if (memo.has(v)) return '<repeat>'
      memo.set(v)
    }
    if (typeof v === 'bigint') {
      return Number(v)
    }
    if (!v) {
      if (typeof v !== 'boolean' && typeof v !== 'number') return '<empty>'
    }
    if (v.constructor && v.constructor.name === 'Error') {
      return { message: v.message, stack: v.stack }
    }
    if (v.constructor && v.constructor.name === 'ArrayBuffer') {
      return 'ArrayBuffer ' + v.byteLength
    }
    if (v.constructor && v.constructor.name === 'Uint8Array') {
      return 'Uint8Array ' + v.length
    }
    if (v.constructor && v.constructor.name === 'Function') {
      return v.toString()
    }
  } catch (err) {
    just.error(`${AR}error in stringify replacer${AD}\n${err.stack}`)
  }
  return v
}

const pretty = (o, sp = '  ') => {
  memo = new Map()
  const text = JSON.stringify(o, replacer, sp)
  if (!text) return
  return text
    .replace(/\s{10}"(.+)":/g, `          ${AC}$1${AD}:`)
    .replace(/\s{8}"(.+)":/g, `        ${AB}$1${AD}:`)
    .replace(/\s{6}"(.+)":/g, `      ${AM}$1${AD}:`)
    .replace(/\s{4}"(.+)":/g, `    ${AG}$1${AD}:`)
    .replace(/\s\s"(.+)":/g, `  ${AY}$1${AD}:`)
    .replace(/"<empty>"/g, `${AC}<empty>${AD}`)
    .replace(/"<repeat>"/g, `${AC}<repeat>${AD}`)
}

function dump (bytes, len = bytes.length, off = 0, width = 16, pos = 0, decimal = false) {
  const result = []
  const chars = []
  const base = decimal ? 10 : 16
  for (let i = 0; i < len; i++) {
    if (i % width === 0) {
      if (i === 0) {
        result.push('')
      } else {
        result.push(` ${chars.join('')}\n`)
        chars.length = 0
      }
    }
    const boff = i + off
    if (i % 8 === 0) {
      result.push(`${AG}${(boff).toString(base).padStart(5, ' ')}${AD}`)
    }
    result.push(` ${bytes[boff].toString(16).padStart(2, '0')}`)
    if (bytes[boff] >= 32 && bytes[boff] <= 126) {
      chars.push(`${AC}${String.fromCharCode(bytes[boff])}${AD}`)
    } else {
      chars.push('.')
    }
  }
  const remaining = width - (len % width)
  if (remaining === width) {
    result.push(` ${chars.join('')}\n`)
  } else if (remaining < 8) {
    result.push(`${'   '.repeat(remaining)} ${chars.join('')}\n`)
  } else {
    result.push(`${'   '.repeat(remaining)}      ${chars.join('')}\n`)
  }
  return result.join('')
}

export { pretty, dump }
