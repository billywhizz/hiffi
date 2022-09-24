#!/bin/bash
if [ ! -f pico.so ]; then
  curl -s -o pico.so -L https://raw.githubusercontent.com/billywhizz/hiffi/main/src/pico.so
fi
LD_PRELOAD=./pico.so deno run --allow-ffi --unstable https://raw.githubusercontent.com/billywhizz/hiffi/main/hello.js
