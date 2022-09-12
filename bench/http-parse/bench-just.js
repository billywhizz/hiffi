const { http } = just.library('http')

const { parseRequestsHandle, createHandle } = http

const buf = ArrayBuffer.fromString('GET /foo HTTP/1.1\r\nHost: foo.bar.baz\r\n\r\n')
const info = new ArrayBuffer(4)
const handle = createHandle(buf, info)
const len = buf.byteLength
const u16 = new Uint16Array(info)

function test () {
  parseRequestsHandle(handle, len, 0)
  const [count, remaining] = u16
  just.print(`requests ${count} remaining ${remaining}`)
}

let repeat = Number(just.args[2] || 1)
const count = Number(just.args[3] || 1000000)
function bench (fun) {
  const start = Date.now()
  for (let i = 0; i < count; i++) fun()
  const elapsed = Date.now() - start
  const rate = Math.floor(count / (elapsed / 1000))
  just.print(`time ${elapsed} ms rate ${rate}`)
  if (--repeat) just.sys.nextTick(() => bench(fun))
}

test()
bench(() => parseRequestsHandle(handle, len, 0))
