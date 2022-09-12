const net = Deno.dlopen('\0', {
  socket: {
    parameters: ['i32', 'i32', 'i32'],
    result: 'i32'
  },
  setsockopt: {
    parameters: ['i32', 'i32', 'i32', 'buffer', 'i32'],
    result: 'i32'
  },
  bind: {
    parameters: ['i32', 'buffer', 'i32'],
    result: 'i32'
  },
  listen: {
    parameters: ['i32', 'i32'],
    result: 'i32'
  },
  close: {
    parameters: ['i32'],
    result: 'i32'
  },
  accept4: {
    parameters: ['i32', 'i32', 'i32', 'i32'],
    result: 'i32'
  },
  send: {
    parameters: ['i32', 'buffer', 'i32', 'i32'],
    result: 'i32'
  },
  recv: {
    parameters: ['i32', 'buffer', 'i32', 'i32'],
    result: 'i32'
  }
}).symbols


const AF_INET = 2
const SOCK_STREAM = 1
const SOCK_NONBLOCK = 2048
const O_NONBLOCK = 2048
const SOL_SOCKET = 1
const SO_REUSEPORT = 15
const SOCKADDR_LEN = 16
const SOMAXCONN = 128
net.constants = {
  AF_INET, SOCK_STREAM, SOCK_NONBLOCK, O_NONBLOCK, SOL_SOCKET, SO_REUSEPORT,
  SOCKADDR_LEN, SOMAXCONN
}

function inet_aton(ip){
  const [b0, b1, b2, b3] = ip.split('.').map(v => (parseInt(v, 10) & 0xff))
  return (b0 << 24) + (b1 << 16) + (b2 << 8) + b3
}

function sockaddr_in (ip, port) {
  const buf = new ArrayBuffer(16)
  const dv = new DataView(buf)
  dv.setInt16(0, AF_INET, true)
  dv.setUint16(2, port & 0xffff)
  dv.setUint32(4, inet_aton(ip))
  return new Uint32Array(buf)
}

net.inet_aton = inet_aton

net.on = new Uint32Array([1])
net.off = new Uint32Array([0])

net.types = {
  sockaddr_in
}

export { net }
