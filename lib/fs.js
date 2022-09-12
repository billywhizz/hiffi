const symbols = {
  close: {
    parameters: ['i32'],
    result: 'i32'
  },
}

const fs = Deno.dlopen('\0', symbols).symbols

export { fs }
