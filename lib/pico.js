import { net } from './net.js'

const pico = Deno.dlopen('pico.so', {
  parse: {
    parameters: ['pointer', 'u32', 'pointer'],
    result: 'i32',
  }
}).symbols

const { decode, encode, byteLength, ops } = Deno.core
const { op_encoding_encode_into } = ops

const MAXHEADERS = 14
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
    this.#method = decode(this.#u8.subarray(0, this.#method_len))
    return this.#method
  }

  get url () {
    if (this.#url) return this.#url
    this.#url = decode(this.#u8.subarray(this.#method_len + 1, this.#method_len + 1 + this.#url_len))
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

const TEXT = `HTTP/1.1 200 OK\r\nContent-Type: text/plain; charset=utf-8\r\nContent-Length: `
const CRLF2 = '\r\n\r\n'
const R404 = encode(`HTTP/1.1 404 Not Found\r\nContent-Type: text/plain; charset=utf-8\r\nContent-Length: 0${CRLF2}`)
const R400 = encode(`HTTP/1.1 400 Bad Request\r\nContent-Type: text/plain; charset=utf-8\r\nContent-Length: 0${CRLF2}`)

const buf = new Uint8Array(16384)
const state = new Uint32Array(2)

const encodeFast = str => {
  op_encoding_encode_into(str, buf, state)
  return state[1]
}

class Response {
  #status = 200
  #fd = 0

  constructor (fd) {
    this.#fd = fd
  }

  text (str, status = this.#status) {
    if (status === 404) {
      net.send(this.#fd, R404, R404.length, 0)
      return
    }
    net.send(this.#fd, buf, encodeFast(`${TEXT}${byteLength(str)}${CRLF2}${str}`), 0)
  }

  write (u8, len = u8.length) {
    return net.send(this.#fd, u8, len, 0)
  }

  end (status = this.#status) {
    if (status === 400) {
      net.send(this.#fd, R400, R400.length, 0)
      return
    }
    net.send(this.#fd, R404, R404.length, 0)
  }

  get status () {
    return this.#status
  }

  set status (code = 200) {
    this.#status = code
  }
}

const HTTP_CTX_SZ = 32
const HTTP_HEADER_SZ = 16

function requestState () {
  const offsets = new Uint8Array(HTTP_CTX_SZ + (HTTP_HEADER_SZ * MAXHEADERS))
  const u32 = new Uint32Array(offsets.buffer)
  offsets[16] = MAXHEADERS
  return u32
}

pico.types = { requestState }
pico.Request = Request
pico.Response = Response

export { pico }
