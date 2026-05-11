import EXIF from 'exif-js'
import type { Photo, PhotoFeatures } from '@/lib/feature-space/feature-space'

const GLM_API_URL = '/api/extract-features'

export interface EXIFData {
  timestamp?: Date
  gps?: { latitude: number; longitude: number }
}

export async function extractEXIF(file: File): Promise<EXIFData> {
  return new Promise((resolve) => {
    const data: EXIFData = {}

    EXIF.getData(file as any, function (this: any) {
      const dateTime = EXIF.getTag(this, 'DateTimeOriginal')
      if (dateTime && typeof dateTime === 'string') {
        try {
          data.timestamp = new Date(dateTime.replace(/(\d{4}):(\d{2}):(\d{2})/, '$1-$2-$3'))
        } catch {
          // Invalid date format, ignore
        }
      }

      const lat = EXIF.getTag(this, 'GPSLatitude')
      const lon = EXIF.getTag(this, 'GPSLongitude')
      const latRef = EXIF.getTag(this, 'GPSLatitudeRef')
      const lonRef = EXIF.getTag(this, 'GPSLongitudeRef')

      if (lat && lon && latRef && lonRef) {
        const toDecimal = (degrees: number[], ref: string) => {
          const [d, m, s] = degrees
          const decimal = d + m / 60 + s / 3600
          return ref === 'S' || ref === 'W' ? -decimal : decimal
        }
        data.gps = {
          latitude: toDecimal(lat as number[], latRef as string),
          longitude: toDecimal(lon as number[], lonRef as string),
        }
      }

      resolve(data)
    })
  })
}

const MAX_RETRIES = 3
const RETRY_DELAY = 2000 // 2 seconds

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function fetchWithRetry(url: string, options: RequestInit, retries = MAX_RETRIES): Promise<Response> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, options)

      if (response.ok) {
        return response
      }

      // Parse error for logging
      const errorText = await response.text()
      lastError = new Error(`HTTP ${response.status}: ${errorText}`)

      // Don't retry on client errors (4xx)
      if (response.status >= 400 && response.status < 500) {
        throw lastError
      }

      // Retry on server errors (5xx) or network issues
      if (attempt < retries) {
        console.warn(`Request failed (attempt ${attempt + 1}/${retries + 1}), retrying in ${RETRY_DELAY}ms...`)
        await sleep(RETRY_DELAY)
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      // Retry on network errors
      if (attempt < retries) {
        console.warn(`Network error (attempt ${attempt + 1}/${retries + 1}), retrying in ${RETRY_DELAY}ms...`)
        await sleep(RETRY_DELAY)
      }
    }
  }

  throw lastError
}

export async function extractVisionFeatures(photo: Photo): Promise<PhotoFeatures> {
  const base64Image = await fileToBase64(photo.file)

  const response = await fetchWithRetry(GLM_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      imageData: base64Image,
      mimeType: photo.file.type,
    }),
  })

  const data = await response.json()
  let text = data.choices?.[0]?.message?.content || ''

  if (!text) {
    throw new Error('Empty response from API')
  }

  // More robust JSON extraction
  // Step 1: Remove markdown code blocks
  text = text
    .replace(/```json\s*/g, '')
    .replace(/```\s*/g, '')
    .trim()

  // Step 2: Try to find complete JSON object
  // Look for the outermost { ... }
  let jsonStr = text
  const firstBrace = text.indexOf('{')
  if (firstBrace !== -1) {
    // Find matching closing brace
    let depth = 0
    for (let i = firstBrace; i < text.length; i++) {
      if (text[i] === '{') depth++
      else if (text[i] === '}') depth--

      if (depth === 0) {
        jsonStr = text.substring(firstBrace, i + 1)
        break
      }
    }

    // If we didn't find complete JSON, take everything from first brace
    if (depth > 0) {
      jsonStr = text.substring(firstBrace)
    }
  }

  // Step 3: Clean up common JSON issues
  jsonStr = jsonStr
    .replace(/,\s*}/g, '}')     // Remove trailing commas before }
    .replace(/,\s*]/g, ']')     // Remove trailing commas before ]
    .replace(/\\+"/g, '"')      // Fix escaped quotes
    .replace(/\\n/g, ' ')       // Fix literal \n
    .replace(/\\r/g, ' ')       // Fix literal \r
    .replace(/\\t/g, ' ')       // Fix literal \t
    // Handle various quote styles
    .replace(/[""]/g, '"')      // Replace fancy quotes
    .replace(/['']/g, "'")      // Replace fancy single quotes
    // Remove control characters except common whitespace
    .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '')
    // Replace multiple spaces with single space
    .replace(/\s+/g, ' ')
    .trim()

  // Step 4: Try to parse, if fails try to fix common issues
  try {
    const parsed = JSON.parse(jsonStr)
    return {
      photoId: photo.id,
      ...parsed,
    }
  } catch (parseError) {
    // Log the error and original text for debugging
    console.error('JSON parse failed for photo:', photo.id)
    console.error('Original text:', text)
    console.error('Cleaned JSON string:', jsonStr)
    console.error('Parse error:', parseError instanceof Error ? parseError.message : parseError)

    // Re-throw error so the photo is marked as failed
    throw new Error(`Failed to parse API response: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`)
  }
}

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      resolve(result.split(',')[1]) // Remove data URL prefix
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export interface ExtractionResult {
  features: PhotoFeatures[]
  failedPhotoIds: string[]
}

export async function extractAllFeatures(
  photos: Photo[],
  onProgress?: (current: number, total: number) => void,
  concurrency: number = 3
): Promise<ExtractionResult> {
  const results: PhotoFeatures[] = []
  const failedPhotoIds: string[] = []
  let completed = 0

  // Process photos in batches
  for (let i = 0; i < photos.length; i += concurrency) {
    const batch = photos.slice(i, i + concurrency)

    // Process each photo with error handling
    const batchPromises = batch.map(async (photo) => {
      try {
        const exif = await extractEXIF(photo.file)
        const vision = await extractVisionFeatures(photo)

        return {
          success: true,
          photoId: photo.id,
          feature: {
            ...vision,
            photoId: photo.id,
            timestamp: exif.timestamp,
            location: vision.location || (exif.gps ? `${exif.gps.latitude}, ${exif.gps.longitude}` : undefined),
          } as PhotoFeatures
        }
      } catch (error) {
        console.error(`Failed to extract features for photo ${photo.id}:`, error)
        return {
          success: false,
          photoId: photo.id,
          error: error instanceof Error ? error.message : String(error)
        }
      }
    })

    const batchResults = await Promise.all(batchPromises)

    // Separate successful and failed results
    for (const result of batchResults) {
      if (result.success && result.feature) {
        results.push(result.feature)
        completed++
      } else {
        failedPhotoIds.push(result.photoId)
      }
    }

    if (onProgress) {
      onProgress(completed, photos.length)
    }
  }

  return {
    features: results,
    failedPhotoIds
  }
}
