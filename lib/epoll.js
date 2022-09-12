const epoll = Deno.dlopen('\0', {
  epoll_create1: {
    parameters: ['i32'],
    result: 'i32'
  },
  epoll_ctl: {
    parameters: ['i32', 'i32', 'i32', 'buffer'],
    result: 'i32'
  },
  epoll_wait: {
    parameters: ['i32', 'buffer', 'i32', 'i32'],
    result: 'i32'
  }
}).symbols

const EPOLLIN = 0x1
const EPOLLOUT = 0x4
const EPOLLERR = 0x8
const EPOLLHUP = 0x10
const EPOLL_CLOEXEC = 524288
const EPOLLEXCLUSIVE = 1 << 28
const EPOLLWAKEUP = 1 << 29
const EPOLLONESHOT = 1 << 30
const EPOLLET = 1 << 31
const EPOLL_CTL_ADD = 1
const EVENT_SIZE = 12

epoll.constants = {
  EPOLLIN, EPOLLOUT, EPOLLERR, EPOLLHUP, EPOLL_CLOEXEC, EPOLLEXCLUSIVE,
  EPOLLWAKEUP, EPOLLONESHOT, EPOLLET, EPOLL_CTL_ADD
}

function event (fd, mask = EPOLLIN | EPOLLOUT) {
  const buf = new ArrayBuffer(EVENT_SIZE)
  const dv = new DataView(buf)
  dv.setUint32(0, mask, true)
  dv.setUint32(4, fd, true)
  return new Uint8Array(buf)
}

function events (nevents = 1024) {
  return new Uint32Array(new ArrayBuffer(nevents * EVENT_SIZE))
}

epoll.types = {
  event,
  events
}

export { epoll }
