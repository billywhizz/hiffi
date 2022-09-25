## run

```bash
## this script will download the pico.so shared library to current directory and deno will take care of downloading all JS deps
sh -c "$(curl -sSL https://raw.githubusercontent.com/billywhizz/hiffi/main/run.sh)"
```

## docker

```bash
## use a local directory for deno cache so we don't have to download every time we run docker
mkdir -p .cache
## download the shared library with pico http parser and zlib wrappers
curl -s -o pico.so -L https://raw.githubusercontent.com/billywhizz/hiffi/main/src/pico.so
## run the docker image from current directory
docker run -e DENO_DIR=./.cache -e ADDRESS=0.0.0.0 -e LD_PRELOAD=./pico.so -it --rm -v $(pwd):/app --workdir=/app -p 3000:3000 denoland/deno:distroless run -A --unstable https://raw.githubusercontent.com/billywhizz/hiffi/main/hello.js
```
