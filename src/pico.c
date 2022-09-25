#include <stdint.h>
#include <stdio.h>
#include <zlib.h>
#include "picohttpparser.h"

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

#define Z_MIN_CHUNK 64
#define Z_MAX_CHUNK std::numeric_limits<double>::infinity()
#define Z_DEFAULT_CHUNK (16 * 1024)
#define Z_MIN_MEMLEVEL 1
#define Z_MAX_MEMLEVEL 9
#define Z_DEFAULT_MEMLEVEL 8
#define Z_MIN_LEVEL -1
#define Z_MAX_LEVEL 9
#define Z_DEFAULT_LEVEL Z_DEFAULT_COMPRESSION
#define Z_MIN_WINDOWBITS 8
#define Z_MAX_WINDOWBITS 15
#define Z_DEFAULT_WINDOW_BITS 15

uint32_t zlib_deflate (uint8_t* src, uint32_t ssize, uint8_t* dest, uint32_t dsize) {
  z_stream* stream = (z_stream*)calloc(1, sizeof(z_stream));
  unsigned int compression = Z_DEFAULT_COMPRESSION;
  int windowbits = 31;
  deflateInit2(stream, compression, Z_DEFLATED, windowbits, Z_DEFAULT_MEMLEVEL, Z_DEFAULT_STRATEGY);
  stream->next_in = (Bytef*)src;
  stream->avail_in = ssize;
  stream->next_out = (Bytef*)dest;
  stream->avail_out = dsize;
  uint32_t avail_out = stream->avail_out;
  uint32_t flush = Z_FINISH;
  deflate(stream, flush);
  uint32_t written = avail_out - stream->avail_out;
  deflateEnd(stream);
  return written;
}

uint32_t zlib_inflate (uint8_t* src, uint32_t ssize, uint8_t* dest, uint32_t dsize) {
  z_stream* stream = (z_stream*)calloc(1, sizeof(z_stream));
  int windowbits = 31;
  inflateInit2(stream, windowbits);
  stream->next_in = (Bytef*)src;
  stream->avail_in = ssize;
  stream->next_out = (Bytef*)dest;
  stream->avail_out = dsize;
  uint32_t avail_out = stream->avail_out;
  uint32_t flush = Z_FINISH;
  inflate(stream, flush);
  uint32_t written = avail_out - stream->avail_out;
  inflateEnd(stream);
  return written;
}

int parse(char* next, ssize_t bytes, httpRequest* req) {
  const char* method;
  const char* path;
  struct phr_header headers[JUST_MAX_HEADERS];
  req->num_headers = JUST_MAX_HEADERS;
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
