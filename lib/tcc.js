const symbols = {
  tcc_new: {
    parameters: [],
    result: 'pointer'
  },
  tcc_set_output_type: {
    parameters: ['pointer', 'i32'],
    result: 'i32'
  },
  tcc_set_options: {
    parameters: ['pointer', 'buffer'],
    result: 'void'
  },
  tcc_add_include_path: {
    parameters: ['pointer', 'buffer'],
    result: 'void'
  },
  tcc_compile_string: {
    parameters: ['pointer', 'buffer'],
    result: 'i32'
  },
  tcc_relocate: {
    parameters: ['pointer', 'i32'],
    result: 'i32'
  },
  tcc_get_symbol: {
    parameters: ['pointer', 'buffer'],
    result: 'pointer'
  }
}

const tcc = Deno.dlopen('libtcc.so', symbols).symbols

export { tcc }
