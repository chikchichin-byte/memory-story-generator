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
        border: photos.length === 0 ? '2px dashed rgba(0,0,0,0.12)' : '1px solid var(--apple-border)',
        borderRadius: 'var(--apple-radius-xl)',
        padding: photos.length === 0 ? '48px 24px' : '20px',
        background: 'var(--apple-card)',
        boxShadow: 'var(--apple-shadow)'
      }}
    >
      <label htmlFor="file-input" className="cursor-pointer">
        <div className="space-y-4">
          {photos.length === 0 && (
            <>
              <svg
                className="mx-auto"
                width="48"
                height="48"
                viewBox="0 0 48 48"
                fill="none"
                stroke="currentColor"
                style={{ color: 'var(--apple-gray-dark)' }}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" />
              </svg>
              <div>
                <p className="text-lg font-medium" style={{ color: 'var(--foreground)' }}>
                  上传照片
                </p>
                <p className="text-sm mt-1" style={{ color: 'var(--apple-gray-dark)' }}>
                  拖拽或点击选择照片
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
