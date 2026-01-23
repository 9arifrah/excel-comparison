import { createServer } from 'http'
import { Server } from 'socket.io'

const PORT = 3003
const HTTP_PORT = 3004

// Create Socket.IO server
const io = new Server(PORT, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
})

console.log(`Comparison progress service running on port ${PORT}`)

// Store comparison jobs in memory
const jobs = new Map()

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id)

  // Join a comparison job room
  socket.on('join-job', (data) => {
    const { jobId } = data
    socket.join(`job-${jobId}`)
    console.log(`Client ${socket.id} joined job ${jobId}`)

    // Send current job status if exists
    const job = jobs.get(jobId)
    if (job) {
      socket.emit('progress', {
        jobId,
        ...job.progress,
        status: job.status,
        error: job.error
      })
    }
  })

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id)
  })
})

// HTTP API for server-to-server communication (from Next.js API routes)
const server = createServer(async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    res.writeHead(200)
    res.end()
    return
  }

  if (req.method === 'POST') {
    let body = ''

    req.on('data', chunk => {
      body += chunk.toString()
    })

    req.on('end', () => {
      try {
        const data = JSON.parse(body)

        // Route to appropriate handler
        if (data.action === 'initialize-job') {
          const { jobId } = data

          // Initialize job
          jobs.set(jobId, {
            status: 'processing',
            progress: {
              stage: 'initializing',
              current: 0,
              total: 100,
              message: 'Initializing comparison...'
            }
          })

          console.log(`[HTTP] Job ${jobId} initialized`)

          // Broadcast to all clients in job room
          io.to(`job-${jobId}`).emit('job-initialized', { jobId, status: 'processing' })

          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ success: true, jobId }))

        } else if (data.action === 'update-progress') {
          const { jobId, stage, current, total, message } = data

          const job = jobs.get(jobId)
          if (job) {
            job.progress = { stage, current, total, message }
            job.status = 'processing'

            // Broadcast to all clients in job room
            io.to(`job-${jobId}`).emit('progress', {
              jobId,
              stage,
              current,
              total,
              message,
              status: 'processing'
            })

            console.log(`[HTTP] Job ${jobId} progress: ${current}/${total} - ${message}`)
          }

          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ success: true }))

        } else if (data.action === 'complete-job') {
          const { jobId } = data
          const job = jobs.get(jobId)

          if (job) {
            job.status = 'complete'

            io.to(`job-${jobId}`).emit('complete', {
              jobId,
              progress: job.progress
            })

            console.log(`[HTTP] Job ${jobId} completed`)

            // Clean up old jobs after 5 minutes
            setTimeout(() => {
              jobs.delete(jobId)
              console.log(`Job ${jobId} cleaned up`)
            }, 5 * 60 * 1000)
          }

          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ success: true }))

        } else if (data.action === 'error-job') {
          const { jobId, error } = data
          const job = jobs.get(jobId)

          if (job) {
            job.status = 'error'
            job.error = error

            io.to(`job-${jobId}`).emit('error', {
              jobId,
              error
            })

            console.error(`[HTTP] Job ${jobId} error: ${error}`)

            // Clean up error jobs after 5 minutes
            setTimeout(() => {
              jobs.delete(jobId)
              console.log(`Job ${jobId} cleaned up`)
            }, 5 * 60 * 1000)
          }

          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ success: true }))
        } else {
          res.writeHead(400, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: 'Unknown action' }))
        }
      } catch (error) {
        console.error('[HTTP] Error:', error)
        res.writeHead(500, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'Failed to process request' }))
      }
    })
  } else {
    res.writeHead(405, { 'Content-Type': 'text/plain' })
    res.end('Method Not Allowed')
  }
})

// HTTP server listens on 3004 (different from Socket.IO port)
server.listen(HTTP_PORT, () => {
  console.log(`HTTP API for progress service running on port ${HTTP_PORT}`)
})
