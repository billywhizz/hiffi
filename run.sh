LD_PRELOAD=$(pwd)/lib/pico.so /home/andrew/.cargo/bin/flamegraph -o deno-perf.svg --palette js -- scratch/deno run -A --v8-flags="--perf-basic-prof" --unstable server.js