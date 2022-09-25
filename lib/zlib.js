const symbols = {
  crc32: {
    parameters: ['u32', 'buffer', 'u32'],
    result: 'u32'
  }
}

const zlib = Deno.dlopen('libz.so', symbols).symbols

const pico = Deno.dlopen('pico.so', {
  zlib_deflate: {
    parameters: ['buffer', 'u32', 'buffer', 'u32'],
    result: 'u32',
  },
  zlib_inflate: {
    parameters: ['buffer', 'u32', 'buffer', 'u32'],
    result: 'u32',
  }
}).symbols

zlib.deflate = pico.zlib_deflate
zlib.inflate = pico.zlib_inflate

export { zlib }
