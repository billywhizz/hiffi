const system = Deno.dlopen('\0', {
  free: {
    parameters: ['pointer'],
    result: 'void'
  },
  calloc: {
    parameters: ['i32', 'i32'],
    result: 'pointer'
  },
  exit: {
    parameters: ['i32'],
    result: 'void'
  },
  sleep : {
    parameters: ['i32'],
    result: 'void'
  },
  usleep : {
    parameters: ['i32'],
    result: 'void'
  },
  chdir: {
    parameters: ['buffer'],
    result: 'i32'
  },
  getcwd: {
    parameters: ['buffer', 'i32'],
    result: 'void'
  },
  getpid: {
    parameters: [],
    result: 'i32'
  },
  perror: {
    parameters: ['buffer'],
    result: 'void'
  },
  strnlen: {
    parameters: ['pointer', 'i32'],
    result: 'i32'
  },
  strerror: {
    parameters: ['i32'],
    result: 'pointer'
  },
  getenv: {
    parameters: ['buffer'],
    result: 'pointer'
  },
  setenv: {
    parameters: ['buffer', 'buffer', 'i32'],
    result: 'i32'
  },
  unsetenv: {
    parameters: ['buffer'],
    result: 'i32'
  },
  clock_gettime: {
    parameters: ['i32', 'pointer'],
    result: 'i32'
  }
}).symbols

const { ops } = Deno.core

const [rid] = ops.op_ffi_load({ path: '\0', symbols: {} })

Object.defineProperty(system, 'errno', {
  configurable: false,
  enumerable: true,
  get: () => ops.op_ffi_get_static(rid, 'errno', 'i32'),
})

const envPtr = ops.op_ffi_get_static(rid, 'environ', 'pointer')
let _env

delete system.calloc
delete system.free

system.env = (force = false) => {
  if (_env && !force) return _env
  const env = []
  let environPtr = BigInt(ops.op_ffi_read_u64(envPtr))
  let farptr = BigInt(ops.op_ffi_read_u64(environPtr + 8n))
  while (farptr) {
    env.push(ops.op_ffi_cstr_read(farptr))
    environPtr += 8n
    farptr = BigInt(ops.op_ffi_read_u64(environPtr + 8n))
  }
  _env = env
    .map(entry => entry.split('='))
    .reduce((e, pair) => { e[pair[0]] = pair[1]; return e }, {})
  return _env
}

system.MAX_PATH = 4096

const cwdbuf = new Uint8Array(system.MAX_PATH)
const cwdptr = ops.op_ffi_ptr_of(cwdbuf)

system._getcwd = system.getcwd
function getcwd () {
  system._getcwd(cwdbuf, system.MAX_PATH)
  return ops.op_ffi_cstr_read(cwdptr)
}
system.getcwd = getcwd

system._strerror = system.strerror
function strerror (errno) {
  return ops.op_ffi_cstr_read(system._strerror(errno))
}
system.strerror = strerror

system._perror = system.perror
system.perror = str => system._perror(system.cstring(str))

system._getenv = system.getenv
system.getenv = str => {
  const ptr = system._getenv(system.cstring(str))
  if (!ptr) return
  return ops.op_ffi_cstr_read(ptr)
}

system._unsetenv = system.unsetenv
system.unsetenv = str => system._unsetenv(system.cstring(str))

system._setenv = system.setenv
system.setenv = (key, val, overwrite = 1) => system._setenv(system.cstring(key), system.cstring(val), overwrite)

const timespec = new Uint8Array(16)
const t32 = new Uint32Array(timespec.buffer)
const tptr = ops.op_ffi_ptr_of(timespec)

const CLOCK_REALTIME = 0
const CLOCK_MONOTONIC = 1

system.hrtime = (clockid = CLOCK_MONOTONIC) => {
  system.clock_gettime(clockid, tptr)
  return (t32[0] * 1e9) + t32[2]
}

system.cstring = str => Deno.core.encode(`${str}\0`)

system.constants = {
  EAGAIN: 11,
  MAX_PATH: system.MAX_PATH,
  CLOCK_REALTIME,
  CLOCK_MONOTONIC
}

export { system }
