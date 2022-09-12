#include <stdint.h>
#include <stdio.h>
#include "deps/picohttpparser/picohttpparser.h"

#define JUST_MAX_HEADERS 14

typedef struct httpHeader httpHeader;
struct httpHeader {
  uint32_t name_start;
  uint32_t name_len;
  uint32_t value_start;
  uint32_t value_len;
};

typedef struct httpRequest httpRequest;
struct httpRequest {
  size_t method_len;
  size_t path_len;
  size_t num_headers;
  int minor_version;
  uint8_t padding[4];
  struct httpHeader headers[JUST_MAX_HEADERS];
};

int parse(char* next, ssize_t bytes, httpRequest* req) {
  const char* method;
  const char* path;
  struct phr_header headers[JUST_MAX_HEADERS];
  int nread = phr_parse_request(next, bytes, 
    (const char **)&method, 
    &req->method_len, (const char **)&path, 
    &req->path_len, &req->minor_version, headers, 
    &req->num_headers, 0);
  for (uint32_t i = 0; i < req->num_headers; i++) {
    req->headers[i].name_start = (uint64_t)headers[i].name - (uint64_t)next;
    req->headers[i].name_len = headers[i].name_len;
    req->headers[i].value_start = (uint64_t)headers[i].value - (uint64_t)next;
    req->headers[i].value_len = headers[i].value_len;
  }
  return nread;
}
