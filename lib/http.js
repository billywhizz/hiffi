import { net } from '../smol.js'

const pico = Deno.dlopen('pico.so', {
  parse: {
    parameters: ['pointer', 'u32', 'pointer'],
    result: 'i32',
  }
}).symbols

const { encode, byteLength } = Deno.core

const b8 = new Uint8Array(0)
const b32 = new Uint32Array(0)

class Request {
  #minor_version = 1
  #method_len = 0
  #url_len = 0
  #num_headers = 0
  #u8 = b8
  #offsets = b32
  #url = ''
  #method = ''
  #cloned = false

  constructor (u8, u32) {
    [this.#method_len, , this.#url_len, , this.#num_headers, , this.#minor_version] = u32
    this.#offsets = u32
    this.#u8 = u8
  }

  get method () {
    if (this.#method) return this.#method
    this.#method = decoder.decode(this.#u8.slice(0, this.#method_len))
    return this.#method
  }

  get url () {
    if (this.#url) return this.#url
    this.#url = decoder.decode(this.#u8.slice(this.#method_len + 1, this.#method_len + 1 + this.#url_len))
    return this.#url
  }

  get minorVersion () {
    return this.#minor_version
  }

  get majorversion () {
    return 1
  }

  clone () {
    if (this.#cloned) return
    this.#u8 = Uint8Array.from(this.#u8)
  }
}

let TEXT = `HTTP/1.1 200 OK\r\nDate: ${(new Date()).toUTCString()}\r\nContent-Type: text/plain; charset=utf-8\r\nContent-Length: `
const HEND = '\r\n\r\n'

class Response {
  #fd = 0

  constructor (fd) {
    this.#fd = fd
  }

  text (str) {
    const payload = encode(`${TEXT}${byteLength(str)}${HEND}${str}`)
    net.send(this.#fd, payload, payload.length, 0)
  }
}

function requestState () {
  const offsets = new Uint8Array(32 + (16 * 14))
  const u32 = new Uint32Array(offsets.buffer)
  offsets[16] = 14
  return u32
}

pico.types = { requestState }
pico.Request = Request
pico.Response = Response

export { pico }
