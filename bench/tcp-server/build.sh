#!/bin/bash
gcc -O3 -Wall -Wextra -D_GNU_SOURCE -mtune=native -march=native -flto -pthread -m64 -s -o bench bench.c