import mongoose from 'mongoose'
import dns from 'dns'
import { env } from '../config/env.js'

try {
  dns.setServers(['8.8.8.8', '1.1.1.1'])
} catch {}

async function clearAll() {
  try {
    await mongoose.connect(env.MONGODB_URI)
    console.log('🔗 Connected to MongoDB...')

    const db = mongoose.connection.db
    const collections = await db.listCollections().toArray()

    if (collections.length === 0) {
      console.log('ℹ️  No collections found — database is already empty.')
      process.exit(0)
    }

    console.log(`\n🗂️  Found ${collections.length} collections:\n`)

    for (const col of collections) {
      const count = await db.collection(col.name).countDocuments()
      await db.collection(col.name).deleteMany({})
      console.log(`  ✅ Cleared: ${col.name} (${count} documents removed)`)
    }

    console.log('\n🎉 All collections cleared successfully!')
    console.log('📦 Database is now empty and ready for fresh data.\n')
    process.exit(0)
  } catch (error) {
    console.error('❌ Error clearing database:', error)
    process.exit(1)
  }
}

clearAll()
