import mongoose from 'mongoose'
import { env } from '../config/env.js'
import User from '../models/User.js'

async function seedAdmin() {
  try {
    await mongoose.connect(env.MONGODB_URI)
    console.log('🌱 Connected to MongoDB to seed Admin user...')

    const adminEmail = 'mindnextarticle@gmail.com'
    const existingAdmin = await User.findOne({ email: adminEmail })

    if (existingAdmin) {
      existingAdmin.role = 'admin'
      existingAdmin.isVerified = true
      existingAdmin.password = 'admin123'
      await existingAdmin.save()
      console.log(`✅ Admin account updated & password reset: ${adminEmail} / admin123 (Role: admin)`)
    } else {
      const adminUser = new User({
        name: 'Lumière Administrator',
        email: adminEmail,
        password: 'admin123',
        role: 'admin',
        isVerified: true,
      })
      await adminUser.save()
      console.log(`✅ Created default Admin account: ${adminEmail} / admin123`)
    }

    process.exit(0)
  } catch (error) {
    console.error('❌ Error seeding Admin user:', error)
    process.exit(1)
  }
}

seedAdmin()
