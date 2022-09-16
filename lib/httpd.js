import { net } from './net.js'
import { epoll } from './epoll.js'
import { system } from './system.js'
import { pico } from './http.js'

const { Request, Response, parse, types } = pico
const { epoll_create1, epoll_wait, epoll_ctl } = epoll
const { 
  EPOLL_CLOEXEC, EPOLLIN, EPOLL_CTL_ADD, EPOLLERR, EPOLLHUP, EPOLLOUT
} = epoll.constants
const { socket, setsockopt, bind, on, listen, close, accept4, send, recv } = net
const { 
  SOCK_STREAM, AF_INET, SOCK_NONBLOCK, SOL_SOCKET, SO_REUSEPORT, SOCKADDR_LEN, 
  SOMAXCONN, O_NONBLOCK
} = net.constants
const { sockaddr_in } = net.types
const { event, events } = epoll.types
const { exit, perror } = system
const { EAGAIN } = system.constants
const { ops, runMicrotasks } = Deno.core
let epoll_fd

function onSocketEvent (fd) {
  const bytes = recv(fd, u8, BUFSIZE, 0)
  if (bytes > 0) {
    const parsed = parse(ptr, bytes, rptr)
    if (parsed < 0) {
      perror('parse_error')
      close(fd)
      delete handles[fd]
      return
    }
    const res = new Response(fd)
    const req = new Request(u8, requestState)
    serveHandler(res, req)
    return
  }
  if (bytes < 0 && system.errno === EAGAIN) return
  perror('socket_error')
  close(fd)
  delete handles[fd]
}

function onConnect (fd) {
  const newfd = accept4(fd, 0, 0, O_NONBLOCK)
  if (newfd > 0) {
    epoll_ctl(epoll_fd, EPOLL_CTL_ADD, newfd, event(newfd, EPOLLIN | EPOLLOUT))
    handles[newfd] = onSocketEvent
    return
  }
  if (system.errno === EAGAIN) return
  perror('accept4')
  close(newfd)
}

function poll (timeout = -1) {
  const n = epoll_wait(epoll_fd, ev8, MAXEVENTS, timeout)
  let off = 0
  for (let i = 0; i < n; i++) {
    const mask = evbuf[off++]
    const fd = evbuf[off++]
    if (mask & EPOLLERR || mask & EPOLLHUP) {
      close(fd)
      delete handles[fd]
      off++
      continue
    }
    handles[fd] && handles[fd](fd)
    off++
  }
  return n
}

const MAXEVENTS = parseInt(system.getenv('MAXEVENTS') || 64, 10)
const BUFSIZE = parseInt(system.getenv('BUFSIZE') || 16384, 10)
const evbuf = events(MAXEVENTS)
const u8 = new Uint8Array(BUFSIZE)
const ptr = ops.op_ffi_ptr_of(u8)
const ev8 = new Uint8Array(evbuf.buffer)
const ADDRESS = system.getenv('ADDRESS') || '127.0.0.1'
const PORT = parseInt(system.getenv('PORT') || 3000, 10)
const handles = {}
const requestState = types.requestState()
const rptr = ops.op_ffi_ptr_of(requestState)
let serveHandler = () => {}

function serve (handler, opts = {}) {
  serveHandler = handler
  const address = opts.address || ADDRESS
  const port = opts.port || PORT
  const sfd = socket(AF_INET, SOCK_STREAM | SOCK_NONBLOCK, 0)
  if (sfd === -1) perror('socket') || exit(1)
  let rc = setsockopt(sfd, SOL_SOCKET, SO_REUSEPORT, on, 32)
  if (rc === -1) perror('setsockopt') || exit(1)
  rc = bind(sfd, sockaddr_in(address, port), SOCKADDR_LEN)
  if (rc === -1) perror('bind') || exit(1)
  rc = listen(sfd, SOMAXCONN)
  if (rc === -1) perror('listen') || exit(1)
  epoll_fd = epoll_create1(EPOLL_CLOEXEC)
  if (epoll_fd === -1) perror('epoll_create1') || exit(1)
  rc = epoll_ctl(epoll_fd, EPOLL_CTL_ADD, sfd, event(sfd, EPOLLIN))
  if (rc === -1) perror('epoll_ctl') || exit(1)
  handles[sfd] = onConnect
  queueMicrotask(() => {
    let n = poll()
    while (n >= 0) {
      runMicrotasks()
      n = poll()
    }
  })
}

export { serve }
