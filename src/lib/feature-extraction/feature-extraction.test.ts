import { describe, it, expect, vi, beforeEach } from 'vitest'
import { extractEXIF, extractVisionFeatures, extractAllFeatures } from './feature-extraction'
import type { Photo } from '@/lib/feature-space/feature-space'

// Mock fetch for GLM API
const mockFetch = vi.fn()
global.fetch = mockFetch

beforeEach(() => {
  mockFetch.mockReset()
})

describe('Feature Extraction', () => {
  describe('extractEXIF', () => {
    it('extracts timestamp and GPS from photo file', async () => {
      const file = new File(['test'], 'photo.jpg', { type: 'image/jpeg' })

      const exif = await extractEXIF(file)

      expect(exif).toBeDefined()
    })

    it('returns empty data when no EXIF exists', async () => {
      const file = new File(['test'], 'no-exif.jpg', { type: 'image/jpeg' })

      const exif = await extractEXIF(file)

      expect(exif.timestamp).toBeUndefined()
      expect(exif.gps).toBeUndefined()
    })
  })

  describe('extractVisionFeatures', () => {
    it('extracts features from photo using Vision API', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [{
            message: {
              content: JSON.stringify({
                location: '巴黎, 法国',
                scene_type: '城市地标',
                emotion: '开心',
                events: ['观光', '散步'],
                objects: ['埃菲尔铁塔', '相机'],
              })
            }
          }]
        })
      })

      // Set API key before importing
      process.env.NEXT_PUBLIC_GEMINI_API_KEY = 'test-key'
      const { extractVisionFeatures: extract } = await import('./feature-extraction')

      const photo: Photo = {
        id: '1',
        file: new File(['test'], 'photo.jpg', { type: 'image/jpeg' }),
        url: 'blob:1',
        uploadedAt: new Date(),
      }

      const features = await extract(photo)

      expect(features).toMatchObject({
        photoId: '1',
        location: expect.any(String),
        emotion: expect.any(String),
      })
    })

    it('returns empty features when no API key', async () => {
      delete process.env.NEXT_PUBLIC_GEMINI_API_KEY

      const photo: Photo = {
        id: '1',
        file: new File(['test'], 'photo.jpg', { type: 'image/jpeg' }),
        url: 'blob:1',
        uploadedAt: new Date(),
      }

      // Should throw error when no API key
      await expect(extractVisionFeatures(photo)).rejects.toThrow()
    }, 10000)
  })

  describe('extractAllFeatures', () => {
    it('processes photos in parallel with progress callback', async () => {
      process.env.NEXT_PUBLIC_GEMINI_API_KEY = 'test-key'

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [{
            message: {
              content: JSON.stringify({
                location: '巴黎',
                emotion: '开心',
                events: ['观光'],
                objects: ['铁塔'],
              })
            }
          }]
        })
      })

      const photos: Photo[] = [
        {
          id: '1',
          file: new File(['test1'], 'photo1.jpg', { type: 'image/jpeg' }),
          url: 'blob:1',
          uploadedAt: new Date(),
        },
        {
          id: '2',
          file: new File(['test2'], 'photo2.jpg', { type: 'image/jpeg' }),
          url: 'blob:2',
          uploadedAt: new Date(),
        },
      ]

      const progressCalls: Array<{ current: number; total: number }> = []
      const onProgress = (current: number, total: number) => {
        progressCalls.push({ current, total })
      }

      const result = await extractAllFeatures(photos, onProgress)

      expect(result.features).toHaveLength(2)
      expect(result.failedPhotoIds).toHaveLength(0)
      expect(progressCalls.length).toBeGreaterThan(0)
      expect(progressCalls[0]).toEqual({ current: 2, total: 2 })
    })

    it('processes in batches with concurrency limit', async () => {
      process.env.NEXT_PUBLIC_GEMINI_API_KEY = 'test-key'

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [{
            message: {
              content: JSON.stringify({
                location: '地点',
                emotion: '情感',
                events: ['活动'],
                objects: ['物品'],
              })
            }
          }]
        })
      })

      const photos: Photo[] = Array.from({ length: 5 }, (_, i) => ({
        id: String(i + 1),
        file: new File([`test${i}`], `photo${i}.jpg`, { type: 'image/jpeg' }),
        url: `blob:${i}`,
        uploadedAt: new Date(),
      }))

      const progressCalls: number[] = []
      const onProgress = (current: number) => progressCalls.push(current)

      const result = await extractAllFeatures(photos, onProgress, 2)

      expect(result.features).toHaveLength(5)
      expect(result.failedPhotoIds).toHaveLength(0)
      // Should have 3 batches: 2 + 2 + 1
      expect(progressCalls).toEqual([2, 4, 5])
    })

    it('handles failed extractions and returns failed photo IDs', async () => {
      process.env.NEXT_PUBLIC_GEMINI_API_KEY = 'test-key'

      mockFetch.mockImplementation(() =>
        Promise.reject(new Error('Network error'))
      )

      const photos: Photo[] = [
        {
          id: '1',
          file: new File(['test1'], 'photo1.jpg', { type: 'image/jpeg' }),
          url: 'blob:1',
          uploadedAt: new Date(),
        },
      ]

      const result = await extractAllFeatures(photos)

      expect(result.features).toHaveLength(0)
      expect(result.failedPhotoIds).toHaveLength(1)
      expect(result.failedPhotoIds[0]).toBe('1')
    }, 20000)

    it('handles partial failures in batch processing', async () => {
      process.env.NEXT_PUBLIC_GEMINI_API_KEY = 'test-key'

      let callCount = 0
      mockFetch.mockImplementation(() => {
        callCount++
        if (callCount === 1) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              choices: [{
                message: {
                  content: JSON.stringify({
                    location: '地点',
                    emotion: '情感',
                    events: ['活动'],
                    objects: ['物品'],
                  })
                }
              }]
            })
          })
        }
        return Promise.reject(new Error('Network error'))
      })

      const photos: Photo[] = [
        {
          id: '1',
          file: new File(['test1'], 'photo1.jpg', { type: 'image/jpeg' }),
          url: 'blob:1',
          uploadedAt: new Date(),
        },
        {
          id: '2',
          file: new File(['test2'], 'photo2.jpg', { type: 'image/jpeg' }),
          url: 'blob:2',
          uploadedAt: new Date(),
        },
      ]

      const result = await extractAllFeatures(photos)

      expect(result.features).toHaveLength(1)
      expect(result.failedPhotoIds).toHaveLength(1)
      expect(result.failedPhotoIds[0]).toBe('2')
    }, 20000)
  })
})
