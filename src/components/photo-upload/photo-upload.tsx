'use client'

import { useCallback, useState } from 'react'
import type { Photo } from '@/lib/feature-space/feature-space'

interface PhotoUploadProps {
  photos?: Photo[] // External photos state for sync
  onPhotosReady: (photos: Photo[]) => void
  onPhotoDelete?: (photoId: string) => void
  onPhotoPreview?: (photoUrl: string) => void
  maxPhotos?: number
}

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/heic']

export function PhotoUpload({ photos: externalPhotos, onPhotosReady, onPhotoDelete, onPhotoPreview, maxPhotos = 10 }: PhotoUploadProps) {
  const [internalPhotos, setInternalPhotos] = useState<Photo[]>([])
  // Use external photos if provided, otherwise use internal state
  const photos = externalPhotos ?? internalPhotos
  const isControlled = externalPhotos !== undefined
  const MAX_PHOTOS = maxPhotos

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files) return

      const validFiles = Array.from(files).filter((file) =>
        ACCEPTED_TYPES.includes(file.type)
      )

      if (validFiles.length === 0) return

      // Check if adding new photos would exceed limit
      if (photos.length + validFiles.length > MAX_PHOTOS) {
        alert(`最多只能上传 ${MAX_PHOTOS} 张照片。当前已上传 ${photos.length} 张，还可添加 ${MAX_PHOTOS - photos.length} 张。`)
        return
      }

      const newPhotos: Photo[] = validFiles.map((file) => ({
        id: crypto.randomUUID(),
        file,
        url: URL.createObjectURL(file),
        uploadedAt: new Date(),
      }))

      const updatedPhotos = [...photos, ...newPhotos]

      if (isControlled) {
        onPhotosReady(updatedPhotos)
      } else {
        setInternalPhotos(updatedPhotos)
        onPhotosReady(updatedPhotos)
      }
    },
    [photos, onPhotosReady, isControlled]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      handleFiles(e.dataTransfer.files)
    },
    [handleFiles]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
  }, [])

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleFiles(e.target.files)
    },
    [handleFiles]
  )

  const handleDelete = (photoId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (onPhotoDelete) {
      onPhotoDelete(photoId)
    } else if (!isControlled) {
      setInternalPhotos(prev => {
        const updated = prev.filter(p => p.id !== photoId)
        onPhotosReady(updated)
        return updated
      })
    }
  }

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      data-drop-zone
      className="transition-all duration-200 cursor-pointer"
      style={{
        border: 'none',
        borderRadius: 'var(--apple-radius-xl)',
        padding: photos.length === 0 ? '56px 24px' : '24px',
        background: 'var(--apple-card)',
        boxShadow: 'var(--apple-shadow)'
      }}
    >
      <label htmlFor="file-input" className="cursor-pointer">
        <div className="space-y-5">
          {photos.length === 0 && (
            <>
              <div className="mx-auto w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(0, 122, 255, 0.08)' }}>
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 28 28"
                  fill="none"
                  style={{ color: 'var(--apple-blue)' }}
                >
                  <path d="M14 3v12m0-12L9 8m5-5l5 5M4 17v4a4 4 0 004 4h12a4 4 0 004-4v-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div>
                <p className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>
                  上传照片
                </p>
                <p className="text-sm mt-1.5" style={{ color: 'var(--apple-gray-dark)' }}>
                  点击或拖拽照片到这里
                </p>
              </div>
            </>
          )}
        </div>
      </label>
      <input
        id="file-input"
        type="file"
        accept={ACCEPTED_TYPES.join(',')}
        multiple
        onChange={handleInputChange}
        disabled={photos.length >= MAX_PHOTOS}
        className="hidden"
      />
      {photos.length > 0 && (
        <div className="mt-0">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
              已上传 {photos.length} 张照片
            </p>
            {photos.length < maxPhotos ? (
              <label htmlFor="file-input" className="text-sm font-medium cursor-pointer transition-opacity hover:opacity-70" style={{ color: 'var(--apple-blue)' }}>
                + 添加更多
              </label>
            ) : (
              <span className="text-sm" style={{ color: 'var(--apple-gray-dark)' }}>已达上限</span>
            )}
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2.5">
            {photos.map((photo) => (
              <div
                key={photo.id}
                className="group relative aspect-square cursor-pointer"
              >
                <img
                  src={photo.url}
                  alt="预览"
                  className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
                  style={{ borderRadius: '12px' }}
                  onClick={() => onPhotoPreview?.(photo.url)}
                />
                <button
                  onClick={(e) => handleDelete(photo.id, e)}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center text-white text-xs opacity-0 group-hover:opacity-100 transition-all duration-200 cursor-pointer z-10"
                  style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', fontSize: '10px' }}
                  title="移除照片"
                >
                  <svg width="8" height="8" viewBox="0 0 8 8" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                    <path d="M1 1l6 6M7 1L1 7" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
          {photos.length >= maxPhotos && (
            <p className="mt-2 text-xs text-center" style={{ color: 'var(--apple-gray-dark)' }}>
              已达到照片数量上限
            </p>
          )}
        </div>
      )}
    </div>
  )
}
