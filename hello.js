import { serve } from './lib/httpd.js'

const hello = Deno.core.encode('HTTP/1.1 200 OK\r\nContent-Length: 13\r\nContent-Type: text/plain; encoding=utf-8\r\n\r\nHello, World!')

serve (res => res.write(hello))
