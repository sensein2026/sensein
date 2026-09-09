import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Standardize uploads directory relative to server root
const uploadDir = path.resolve(__dirname, '../../uploads')
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir)
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname || '').toLowerCase() || '.jpg'
    const baseName = path
      .basename(file.originalname || 'media', ext)
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 40)
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e4)
    cb(null, `media-${uniqueSuffix}-${baseName}${ext}`)
  },
})

// File filter supporting all image and video formats (Reels, MP4, WebM, MOV, JPG, PNG, WEBP, etc.)
const fileFilter = (req, file, cb) => {
  // Allow all image and video types seamlessly
  cb(null, true)
}

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB max for HD video reels & images
  },
})

