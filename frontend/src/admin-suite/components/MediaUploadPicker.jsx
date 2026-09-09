import { useState, useRef } from 'react'
import { useUploadMediaMutation } from '@/features/adminApi'
import { useToast } from '@/context/ToastContext'
import {
  Upload,
  Image as ImageIcon,
  Video,
  Link2,
  X,
  Loader2,
  CheckCircle2,
} from 'lucide-react'

export default function MediaUploadPicker({
  value,
  onChange,
  label = 'Media Asset',
  category = 'general',
  mediaType = 'any', // 'image' | 'video' | 'any'
  placeholder = 'Select or upload photo/video...',
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [pickerTab, setPickerTab] = useState('upload') // 'upload' | 'url'
  const [customUrl, setCustomUrl] = useState(value || '')
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef(null)
  const { addToast } = useToast()

  const [uploadMedia, { isLoading: isUploading }] = useUploadMediaMutation()

  const processFile = async (file) => {
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)
    formData.append('category', category)
    formData.append('usageLocation', label)

    try {
      const res = await uploadMedia(formData).unwrap()
      const fileUrl = res?.url || res?.data?.fileUrl
      if (fileUrl) {
        onChange(fileUrl)
        setCustomUrl(fileUrl)
        addToast({
          type: 'create',
          title: 'File Uploaded',
          message: 'File uploaded and saved successfully!',
        })
        setIsOpen(false)
      } else {
        throw new Error('Upload succeeded but no URL was returned.')
      }
    } catch (err) {
      console.error('Media upload error:', err)
      const errorMsg =
        err?.data?.message ||
        err?.error ||
        err?.message ||
        (typeof err === 'string' ? err : 'Failed to upload file. Please try again.')
      addToast({
        type: 'error',
        title: 'Upload Failed',
        message: errorMsg,
      })
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      processFile(file)
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
    const file = e.dataTransfer?.files?.[0]
    if (file) {
      processFile(file)
    }
  }

  const handleApplyCustomUrl = () => {
    onChange(customUrl)
    setIsOpen(false)
  }

  const isVideo = (url) => {
    if (!url) return false
    return (
      url.endsWith('.mp4') ||
      url.endsWith('.webm') ||
      url.endsWith('.mov') ||
      url.includes('/video')
    )
  }

  return (
    <div className="space-y-1.5 w-full">
      {label && (
        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
          {label}
        </label>
      )}

      {/* Main Bar with Preview + Open Button */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 flex items-center bg-slate-50 border border-slate-200 rounded-xl overflow-hidden focus-within:border-blue-600 focus-within:bg-white transition-colors">
          {/* Small Preview Thumbnail */}
          <div className="w-10 h-10 shrink-0 bg-slate-900 border-r border-slate-200 flex items-center justify-center overflow-hidden p-1">
            {value ? (
              isVideo(value) ? (
                <Video className="h-4 w-4 text-blue-400" />
              ) : (
                <img
                  src={value}
                  alt="Preview"
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    e.target.style.display = 'none'
                  }}
                />
              )
            ) : mediaType === 'video' ? (
              <Video className="h-4 w-4 text-slate-400" />
            ) : (
              <ImageIcon className="h-4 w-4 text-slate-400" />
            )}
          </div>

          <input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="flex-1 bg-transparent text-slate-900 text-xs px-3 py-2.5 focus:outline-none font-mono truncate placeholder:text-slate-400 font-medium"
          />

          {value && (
            <button
              type="button"
              onClick={() => onChange('')}
              className="p-2 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              title="Clear"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Action Button to Open Modal */}
        <button
          type="button"
          onClick={() => {
            setCustomUrl(value || '')
            setIsOpen(true)
          }}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all shrink-0 cursor-pointer"
        >
          <Upload className="h-3.5 w-3.5" />
          <span>Upload File</span>
        </button>
      </div>

      {/* Modal Popup for Direct Upload */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-100 text-blue-700 border border-blue-200">
                  <Upload className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 font-display">Upload Media File</h3>
                  <p className="text-[11px] text-slate-500 font-mono">
                    Target: {label} • Format: {mediaType.toUpperCase()}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-200/60 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex items-center border-b border-slate-200 bg-slate-50/50 px-5 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPickerTab('upload')}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                  pickerTab === 'upload'
                    ? 'border-blue-600 text-blue-600 bg-white rounded-t-xl shadow-xs'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <Upload className="h-3.5 w-3.5" />
                <span>Upload From Computer</span>
              </button>

              <button
                type="button"
                onClick={() => setPickerTab('url')}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                  pickerTab === 'url'
                    ? 'border-blue-600 text-blue-600 bg-white rounded-t-xl shadow-xs'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <Link2 className="h-3.5 w-3.5" />
                <span>Direct URL</span>
              </button>
            </div>

            {/* Tab Body */}
            <div className="p-6 space-y-4">
              {/* TAB 1: Direct File Upload */}
              {pickerTab === 'upload' && (
                <div className="space-y-4">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed p-8 rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer transition-all space-y-3 group ${
                      isDragOver
                        ? 'border-blue-600 bg-blue-50/80 scale-[1.01]'
                        : 'border-slate-300 hover:border-blue-500 bg-slate-50 hover:bg-blue-50/40'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="video/*,image/*,.mp4,.mov,.webm,.mkv,.avi,.3gp,.jpg,.jpeg,.png,.webp,.svg"
                      onChange={handleFileUpload}
                      className="hidden"
                    />

                    {isUploading ? (
                      <div className="flex flex-col items-center gap-2 text-blue-600">
                        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
                        <span className="text-xs font-mono font-bold">Uploading & Saving to Database...</span>
                      </div>
                    ) : (
                      <>
                        <div className="p-4 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 group-hover:scale-110 transition-transform">
                          <Upload className="h-8 w-8" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900">
                            {isDragOver ? 'Drop video or photo file here' : 'Click or Drag & Drop photo / video file from your computer'}
                          </p>
                          <p className="text-[11px] text-slate-500 mt-1">
                            Supports MP4, MOV, WEBM, JPG, PNG, WEBP (Direct DB Save up to 200MB)
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: Direct URL */}
              {pickerTab === 'url' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Direct Photo / Video URL Link
                    </label>
                    <input
                      type="text"
                      placeholder="https://images.unsplash.com/... or /uploads/..."
                      value={customUrl}
                      onChange={(e) => setCustomUrl(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none font-mono"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleApplyCustomUrl}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/20 transition-all cursor-pointer"
                  >
                    Apply URL Link
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

