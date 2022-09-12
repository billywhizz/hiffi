C=gcc
MODULE=pico

.PHONY: help clean

help:
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z0-9_\.-]+:.*?## / {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

deps: ## dependencies
	mkdir -p deps/picohttpparser
	curl -L -o deps/picohttpparser/picohttpparser.h https://raw.githubusercontent.com/h2o/picohttpparser/master/picohttpparser.h
	curl -L -o deps/picohttpparser/picohttpparser.c https://raw.githubusercontent.com/h2o/picohttpparser/master/picohttpparser.c

library: ${MODULE}.c deps/picohttpparser/picohttpparser.c ## compile picohttpparser shared lib
	$(C) -c -fPIC -Ideps/picohttpparser -g -O3 -Wall -Wextra -march=native -mtune=native -m64 -msse4 deps/picohttpparser/picohttpparser.c
	$(C) -c -fPIC -Ideps/picohttpparser -g -O3 -Wall -Wextra -march=native -mtune=native -m64 ${MODULE}.c
	$(C) -g -shared -flto -pthread -m64 -Wl,--start-group picohttpparser.o ${MODULE}.o -Wl,--end-group -Wl,-soname=${MODULE}.so -o lib/${MODULE}.so
	objcopy --only-keep-debug lib/${MODULE}.so lib/${MODULE}.so.debug
	strip --strip-debug --strip-unneeded lib/${MODULE}.so

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
