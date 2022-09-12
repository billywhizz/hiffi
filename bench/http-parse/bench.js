import { pico } from '../../lib/http.js'

const { parse, types } = pico
const { encode, ops } = Deno.core
const u8 = encode('GET /foo HTTP/1.1\r\nHost: foo.bar.baz\r\n\r\n')
const ptr = ops.op_ffi_ptr_of(u8)
const len = u8.length
const requestState = types.requestState()
const rptr = ops.op_ffi_ptr_of(requestState)

function test () {
  const rc = parse(ptr, len, rptr)
  if (rc < 0) throw new Error('parse failed')
  console.log(`parse ${rc}`)
}

let repeat = Number(Deno.args[0] || 1)
const count = Number(Deno.args[1] || 1000000)

function bench (fun) {
  const start = Date.now()
  for (let i = 0; i < count; i++) fun()
  const elapsed = Date.now() - start
  const rate = Math.floor(count / (elapsed / 1000))
  console.log(`time ${elapsed} ms rate ${rate}`)
  if (--repeat) queueMicrotask(() => bench(fun))
}

test()
bench(() => parse(ptr, len, rptr))
