import { serve } from './lib/httpd.js'

serve ((res, req) => {
  if (req.method === 'GET' && req.url === '/') {
    res.text('Hello, World!')
    return
  }
  res.end(404)
})
