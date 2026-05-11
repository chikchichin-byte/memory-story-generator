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
      className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
        photos.length === 0
          ? 'border-zinc-300 hover:border-zinc-400'
          : 'border-zinc-200'
      }`}
    >
      <label htmlFor="file-input" className="cursor-pointer">
        <div className="space-y-4">
          {photos.length === 0 && (
            <>
              <svg
                className="mx-auto h-12 w-12 text-zinc-400"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
              >
                <path
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div>
                <p className="text-lg font-medium text-zinc-900">
                  上传照片
                </p>
                <p className="text-sm text-zinc-500">
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
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              已上传 {photos.length} 张照片
            </p>
            {photos.length < maxPhotos ? (
              <label htmlFor="file-input" className="text-sm text-blue-600 dark:text-blue-400 cursor-pointer hover:underline">
                + 添加更多
              </label>
            ) : (
              <span className="text-sm text-zinc-400">已达上限</span>
            )}
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
            {photos.map((photo) => (
              <div
                key={photo.id}
                className="group relative aspect-square cursor-pointer"
              >
                <img
                  src={photo.url}
                  alt="预览"
                  className="w-full h-full object-cover rounded-lg group-hover:opacity-90 transition-opacity"
                  onClick={() => onPhotoPreview?.(photo.url)}
                />
                <button
                  onClick={(e) => handleDelete(photo.id, e)}
                  className="absolute top-1 right-1 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-sm z-10"
                  title="移除照片"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          {photos.length >= maxPhotos && (
            <p className="mt-2 text-xs text-zinc-500 text-center">
              已达到照片数量上限
            </p>
          )}
        </div>
      )}
    </div>
  )
}
