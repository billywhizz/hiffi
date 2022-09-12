import { parse, state_address } from '../../lib/http.js'

const { decode, encode, ops } = Deno.core

class Request {
  method = ''
  path = ''
  minorVersion = 1
  bodySize = 0
  headers = []
}

class Record {
  minorVersion = 1
  methodStart = 0
  methodSize = 0
  pathStart = 0
  pathSize = 0
  bodySize = 0
  numHeaders = 0
  headers = [
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ]
}

function bench (fun) {
  const start = Date.now()
  for (let i = 0; i < count; i++) fun()
  const elapsed = Date.now() - start
  const rate = Math.floor(count / (elapsed / 1000))
  console.log(`time ${elapsed} ms rate ${rate}`)
  if (--repeat) queueMicrotask(() => bench(fun))
}

const records = (new Array(0xfff)).fill(0).map(v => new Record())

const recLen = (72 / 4)
const headLen = ((64 * 32) / 4)

const offsets = new Uint32Array((7 + (4 * 64)) * 0xfff)

// 22m/sec
function parseRequests6 () {
  const rc = parse(ptr, len)
  const rcount = rc & 0xfff
  return rcount
}

// 15m/sec
function parseRequests5 () {
  const rc = parse(ptr, len)
  const rcount = rc & 0xfff
  let off = 0
  let nh = 0
  for (let i = 0; i < rcount; i++) {
    const rec = records[i]
    rec.minorVersion = u32[off]
    rec.methodSize = u32[off + 4]
    rec.pathSize = u32[off + 6]
    rec.bodySize = u32[off + 8]
    rec.numHeaders = nh = u32[off + 10]
    off += recLen
    for (let j = 0; j < nh; j++) {
      const header = rec.headers[j]
      header[1] = u32[off]
      header[3] = u32[off + 2]
      off += 8
    }
    off += headLen
  }
  return rcount
}

// 5m/sec
function parseRequests4 () {
  const rc = parse(ptr, len)
  const rcount = rc & 0xfff
  let off = 0
  let nh = 0
  for (let i = 0; i < rcount; i++) {
    const rec = records[i]
    rec.minorVersion = u32[off]
    rec.methodSize = u32[off + 4]
    rec.pathSize = u32[off + 6]
    rec.bodySize = u32[off + 8]
    rec.numHeaders = nh = u32[off + 10]
    rec.pathStart = Number(u64[(off + 12) / 2]) - ptr
    rec.methodStart = Number(u64[(off + 14) / 2]) - ptr
    off += recLen
    for (let j = 0; j < nh; j++) {
      const header = rec.headers[j]
      header[0] = Number(u64[(off + 4) / 2]) - ptr
      header[1] = u32[off]
      header[2] = Number(u64[(off + 6) / 2]) - ptr
      header[3] = u32[off + 2]
      off += 8
    }
    off += headLen
  }
  return rcount
}

// 4.8m/sec
function parseRequests3 () {
  const rc = parse(ptr, len)
  const rcount = rc & 0xfff
  let next = 0
  let off = 0
  let nh = 0
  for (let i = 0; i < rcount; i++) {
    offsets[next++] = u32[off]
    offsets[next++] = u32[off + 4]
    offsets[next++] = u32[off + 6]
    offsets[next++] = u32[off + 8]
    offsets[next++] = nh = u32[off + 10]
    offsets[next++] = Number(u64[(off + 12) / 2]) - ptr
    offsets[next++] = Number(u64[(off + 14) / 2]) - ptr
    off += recLen
    for (let j = 0; j < nh; j++) {
      offsets[next++] = Number(u64[(off + 4) / 2]) - ptr
      offsets[next++] = u32[off]
      offsets[next++] = Number(u64[(off + 6) / 2]) - ptr
      offsets[next++] = u32[off + 2]
      off += 8
    }
    off += headLen
  }
  return rcount
}

// 900k/sec
function parseRequests2 () {
  const rc = parse(ptr, len)
  const rcount = rc & 0xfff
  const records = new Array(rcount)
  let state = statePtr
  for (let i = 0; i < rcount; i++) {
    const rec = new Record()
    rec.minorVersion = ops.op_ffi_read_i32(state)
    rec.methodSize = ops.op_ffi_read_u32(state + 16)
    rec.pathSize = ops.op_ffi_read_u32(state + 24)
    rec.bodySize = ops.op_ffi_read_u32(state + 32)
    rec.numHeaders = ops.op_ffi_read_u32(state + 40)
    rec.pathStart = Number(ops.op_ffi_read_u64(state + 48) - ptr)
    rec.methodStart = Number(ops.op_ffi_read_u64(state + 56) - ptr)
    state += 72
    const addr = state
    for (let j = 0; j < rec.numHeaders; j++) {
      rec.headers[j][0] = Number(ops.op_ffi_read_u64(addr + 16) - ptr)
      rec.headers[j][1] = ops.op_ffi_read_u32(addr)
      rec.headers[j][2] = Number(ops.op_ffi_read_u64(addr + 24) - ptr)
      rec.headers[j][3] = ops.op_ffi_read_u32(addr + 8)
    }
    state += (64 * 32)
    records[i] = rec
  }
  return records
}

// 290k/sec
function parseRequests () {
  const rc = parse(ptr, len)
  const rcount = rc & 0xfff
  const requests = new Array(rcount)
  let state = statePtr
  for (let i = 0; i < rcount; i++) {
    const req = new Request()
    req.minorVersion = ops.op_ffi_read_i32(state)
    const method_len = ops.op_ffi_read_u32(state + 16)
    const path_len = ops.op_ffi_read_u32(state + 24)
    req.bodySize = ops.op_ffi_read_u32(state + 32)
    const num_headers = ops.op_ffi_read_u32(state + 40)
    const pathPtr = ops.op_ffi_read_u64(state + 48)
    req.path = decode(ops.op_ffi_get_buf(pathPtr, path_len))
    const methodPtr = ops.op_ffi_read_u64(state + 56)
    req.method = decode(ops.op_ffi_get_buf(methodPtr, method_len))
    state += 72
    const addr = state
    for (let j = 0; j < num_headers; j++) {
      const name_len = ops.op_ffi_read_u32(addr)
      const value_len = ops.op_ffi_read_u32(addr + 8)
      const namePtr = ops.op_ffi_read_u64(addr + 16)
      const name = ops.op_ffi_get_buf(namePtr, name_len)
      const valuePtr = ops.op_ffi_read_u64(addr + 24)
      const value = ops.op_ffi_get_buf(valuePtr, value_len)
      req.headers.push([decode(name), decode(value)])
    }
    state += (64 * 32)
    requests[i] = req
  }
  return requests
}

const u8 = encode('GET /foo HTTP/1.1\r\nHost: foo.bar.baz\r\n\r\n')
const ptr = ops.op_ffi_ptr_of(u8)
const len = u8.length
let repeat = Number(Deno.args[0] || 1)
const count = Number(Deno.args[1] || 1000000)
const statePtr = state_address()

const state = ops.op_ffi_get_buf(statePtr, (72 + (64 * 32)) * 0xfff)
const u32 = new Uint32Array(state)
const u64 = new BigUint64Array(state)

bench(parseRequests3)
