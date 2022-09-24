C=gcc
MODULE=pico

.PHONY: help clean

help:
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z0-9_\.-]+:.*?## / {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

deps: ## dependencies
	mkdir -p picohttpparser
	curl -L -o picohttpparser.h https://raw.githubusercontent.com/h2o/picohttpparser/master/picohttpparser.h
	curl -L -o picohttpparser.c https://raw.githubusercontent.com/h2o/picohttpparser/master/picohttpparser.c
	mkdir -p hescape
	curl -L -o hescape.h https://raw.githubusercontent.com/k0kubun/hescape/master/hescape.h
	curl -L -o hescape.c https://raw.githubusercontent.com/k0kubun/hescape/master/hescape.c

library: ## compile shared library and dependencies
	$(C) -c -fPIC -g -O3 -Wall -Wextra -march=native -mtune=native -m64 -msse4.2 -std=c11 -o hescape.o hescape.c
	$(C) -c -fPIC -g -O3 -Wall -Wextra -march=native -mtune=native -m64 -msse4.2 -std=c11 -o picohttpparser.o picohttpparser.c
	$(C) -c -fPIC -g -O3 -Wall -Wextra -march=native -mtune=native -m64 ${MODULE}.c
	$(C) -g -nostdlib -shared -flto -pthread -m64 -Wl,--start-group picohttpparser.o hescape.o ${MODULE}.o -Wl,--end-group -Wl,-soname=${MODULE}.so -o ${MODULE}.so
	objcopy --only-keep-debug ${MODULE}.so ${MODULE}.so.debug
	strip --strip-debug --strip-unneeded ${MODULE}.so

clean: ## tidy up
	rm -f *.o
	rm -f *.so
	rm -f *.so.debug
	
all: ## make all
	make clean
	make deps
	make library

cleanall: ## tidy up dependencies
	make clean
	rm -fr deps

.DEFAULT_GOAL := help
