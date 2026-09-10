import mongoose from 'mongoose'
import { env } from '../config/env.js'
import User from '../models/User.js'

// Connect using the same URI the running server uses
// If SRV fails, try directConnection
async function resetAdmin() {
  try {
    // Try connecting - if DNS SRV fails, swap mongodb+srv:// to mongodb://
    let uri = env.MONGODB_URI
    try {
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 })
    } catch (e) {
      console.log('SRV connect failed, trying direct...')
      // Try without SRV
      uri = uri.replace('mongodb+srv://', 'mongodb://')
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000, directConnection: true })
    }

    console.log('🌱 Connected to MongoDB...')

    const email = 'mindnextarticle@gmail.com'
    let user = await User.findOne({ email })

    if (user) {
      user.password = 'admin123'
      user.role = 'admin'
      user.isVerified = true
      await user.save()
      console.log(`✅ Admin password reset: ${email} / admin123`)
    } else {
      user = new User({
        name: 'Sensein Admin',
        email,
        password: 'admin123',
        role: 'admin',
        isVerified: true,
      })
      await user.save()
      console.log(`✅ Created admin: ${email} / admin123`)
    }

    process.exit(0)
  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

resetAdmin()
