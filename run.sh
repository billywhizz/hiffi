#!/bin/bash
if [ ! -f pico.so ]; then
  curl -s -o pico.so -L https://raw.githubusercontent.com/billywhizz/hiffi/main/lib/pico.so
fi
LD_LIBRARY_PATH=./ deno run --allow-ffi --unstable https://raw.githubusercontent.com/billywhizz/hiffi/main/server.js
