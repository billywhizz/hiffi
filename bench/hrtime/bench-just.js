const { hrtime } = just

const args = just.args.slice(2)
let total = parseInt(args[0], 10)
const count = parseInt(args[1], 10)

function bench (fun) {
  const start = Date.now()
  for (let i = 0; i < count; i++) fun()
  const elapsed = Date.now() - start
  const rate = Math.floor(count / (elapsed / 1000))
  just.print(`time ${elapsed} ms rate ${rate}`)
  if (--total) just.sys.nextTick(() => bench(fun))
}

bench(() => hrtime())
