import { v2 as cloudinary } from 'cloudinary'
import path from 'path'
import fs from 'fs'

// Initialize Cloudinary with environment variables
function getCloudinaryInstance() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME || ''
  const apiKey = process.env.CLOUDINARY_API_KEY || ''
  const apiSecret = process.env.CLOUDINARY_API_SECRET || ''

  if (cloudName && apiKey && apiSecret) {
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    })
    return true
  }
  return false
}

/**
 * Smart Hybrid Uploader:
 * 1. Tries uploading to Cloudinary (for auto-optimization & CDN delivery)
 * 2. If Cloudinary fails (e.g. file size > 100MB, video quota, network timeout) or not configured:
 *    -> Automatically & seamlessly falls back to Local Server storage (/uploads/...)
 * 
 * @param {Object} file - Multer file object (has path, filename, mimetype, size)
 * @param {Object} options - Optional upload options (folder, etc.)
 * @returns {Promise<{ url: string, provider: 'cloudinary' | 'local', publicId?: string }>}
 */
export async function uploadWithCloudinaryFallback(file, options = {}) {
  const localUrl = `/uploads/${file.filename}`
  const isConfigured = getCloudinaryInstance()

  if (!isConfigured) {
    return {
      url: localUrl,
      provider: 'local',
    }
  }

  try {
    const isVideo = file.mimetype.startsWith('video/')
    const resourceType = isVideo ? 'video' : 'auto'

    const result = await cloudinary.uploader.upload(file.path, {
      folder: options.folder || 'sensein_media',
      resource_type: resourceType,
      use_filename: true,
      unique_filename: true,
      overwrite: false,
    })

    if (result && result.secure_url) {
      return {
        url: result.secure_url,
        provider: 'cloudinary',
        publicId: result.public_id,
        format: result.format,
        bytes: result.bytes,
      }
    }

    return {
      url: localUrl,
      provider: 'local',
    }
  } catch (error) {
    console.warn(
      `[Cloudinary Fallback Notice] File ${file.originalname} (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeded Cloudinary limit or failed: ${error.message}. Seamlessly falling back to local server storage.`
    )
    return {
      url: localUrl,
      provider: 'local',
      fallbackReason: error.message,
    }
  }
}

export { cloudinary }
