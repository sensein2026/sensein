import mongoose from 'mongoose'
import { sendSuccess } from '../utils/apiResponse.js'

const READY_STATES = ['disconnected', 'connected', 'connecting', 'disconnecting']

export function getHealth(req, res) {
  sendSuccess(res, {
    message: 'Service healthy',
    data: {
      status: 'ok',
      uptimeSeconds: Math.round(process.uptime()),
      database: READY_STATES[mongoose.connection.readyState],
      timestamp: new Date().toISOString(),
    },
  })
}
