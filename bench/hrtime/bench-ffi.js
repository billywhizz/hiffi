import { system } from '../../smol.js'

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

console.log(system.hrtime())
bench(() => system.hrtime())