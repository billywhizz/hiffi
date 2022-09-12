import { serve } from './lib/httpd.js'

serve(res => res.text('Hello, World!'))
