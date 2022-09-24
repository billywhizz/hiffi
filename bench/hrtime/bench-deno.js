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

const { ops } = Deno.core
const u8 = new Uint8Array(8)
const u64 = new BigUint64Array(u8.buffer)
function opNow() {
  ops.op_now.fast(u8)
  return u64[0]
}

console.log(opNow())
bench(opNow)
