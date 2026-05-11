import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PhotoUpload } from './photo-upload'
import type { Photo } from '@/lib/feature-space/feature-space'

describe('PhotoUpload', () => {
  it('renders upload area', () => {
    const onPhotosReady = vi.fn()
    render(<PhotoUpload onPhotosReady={onPhotosReady} />)

    expect(screen.getByText('上传照片')).toBeInTheDocument()
    expect(screen.getByText('拖拽或点击选择照片')).toBeInTheDocument()
  })

  it('accepts photo files via input', async () => {
    const onPhotosReady = vi.fn()
    const { container } = render(<PhotoUpload onPhotosReady={onPhotosReady} />)

    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
    const input = container.querySelector<HTMLInputElement>('input[type="file"]')

    expect(input).not.toBeNull()

    if (input) {
      await userEvent.upload(input, [file])

      await waitFor(() => {
        expect(onPhotosReady).toHaveBeenCalled()
      })
    }
  })

  it('handles drag and drop', async () => {
    const onPhotosReady = vi.fn()
    const { container } = render(<PhotoUpload onPhotosReady={onPhotosReady} />)

    const dropZone = container.querySelector('.border-dashed') as HTMLElement
    expect(dropZone).toBeInTheDocument()

    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })

    // Create a mock DataTransfer object
    const dataTransfer = {
      files: [file],
      items: [{ kind: 'file', type: 'image/jpeg' }],
      types: ['Files']
    }

    // Fire drag events
    await userEvent.pointer([
      { keys: '[MouseLeft]', target: dropZone },
      { pointerName: 'mouse', target: dropZone },
    ])

    // Manually create and dispatch drop event
    const dropEvent = new Event('drop', { bubbles: true })
    Object.defineProperty(dropEvent, 'dataTransfer', { value: dataTransfer })
    dropZone.dispatchEvent(dropEvent)

    await waitFor(() => {
      expect(onPhotosReady).toHaveBeenCalled()
    })
  })

  it('displays uploaded photos', () => {
    const photos: Photo[] = [
      {
        id: '1',
        file: new File(['test'], 'test.jpg', { type: 'image/jpeg' }),
        url: 'blob:1',
        uploadedAt: new Date(),
      }
    ]
    const onPhotosReady = vi.fn()
    render(<PhotoUpload photos={photos} onPhotosReady={onPhotosReady} />)

    expect(screen.getByText('已上传 1 张照片')).toBeInTheDocument()
    expect(screen.getByAltText('预览')).toBeInTheDocument()
  })

  it('deletes photo when delete button clicked', async () => {
    const photos: Photo[] = [
      {
        id: '1',
        file: new File(['test'], 'test.jpg', { type: 'image/jpeg' }),
        url: 'blob:1',
        uploadedAt: new Date(),
      }
    ]
    const onPhotoDelete = vi.fn()
    render(<PhotoUpload photos={photos} onPhotosReady={vi.fn()} onPhotoDelete={onPhotoDelete} />)

    const deleteButton = screen.getByTitle('移除照片')
    await userEvent.click(deleteButton)

    expect(onPhotoDelete).toHaveBeenCalledWith('1')
  })

  it('calls onPhotoPreview when photo clicked', async () => {
    const photos: Photo[] = [
      {
        id: '1',
        file: new File(['test'], 'test.jpg', { type: 'image/jpeg' }),
        url: 'blob:test-url',
        uploadedAt: new Date(),
      }
    ]
    const onPhotoPreview = vi.fn()
    render(<PhotoUpload photos={photos} onPhotosReady={vi.fn()} onPhotoPreview={onPhotoPreview} />)

    const photo = screen.getByAltText('预览')
    await userEvent.click(photo)

    expect(onPhotoPreview).toHaveBeenCalledWith('blob:test-url')
  })

  it('prevents uploading more than max photos', async () => {
    const onPhotosReady = vi.fn()
    const { container } = render(<PhotoUpload onPhotosReady={onPhotosReady} maxPhotos={2} />)

    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
    const input = container.querySelector<HTMLInputElement>('input[type="file"]')

    if (input) {
      // Upload first file
      await userEvent.upload(input, [file])
      await waitFor(() => expect(onPhotosReady).toHaveBeenCalledTimes(1))

      // Try to upload 3 more files (exceeds limit)
      const files = [
        new File(['test2'], 'test2.jpg', { type: 'image/jpeg' }),
        new File(['test3'], 'test3.jpg', { type: 'image/jpeg' }),
        new File(['test4'], 'test4.jpg', { type: 'image/jpeg' }),
      ]
      await userEvent.upload(input, files)

      // Should show alert and not upload due to limit
      expect(onPhotosReady).toHaveBeenCalledTimes(1)
    }
  })

  it('shows "已达上限" when max photos reached', () => {
    const photos: Photo[] = Array.from({ length: 10 }, (_, i) => ({
      id: String(i),
      file: new File(['test'], `test${i}.jpg`, { type: 'image/jpeg' }),
      url: `blob:${i}`,
      uploadedAt: new Date(),
    }))
    render(<PhotoUpload photos={photos} onPhotosReady={vi.fn()} maxPhotos={10} />)

    expect(screen.getByText('已达上限')).toBeInTheDocument()
  })
})
