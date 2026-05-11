import type { Photo, PhotoFeatures } from '@/lib/feature-space/feature-space'
import type { StoryArc } from '@/lib/story-arc/story-arc'

export interface StoryboardFrame {
  id: string
  photoId: string
  segmentId: string
  order: number
  narration: string // 叙事描述/旁白
  duration: number // 建议时长（秒）
  transition?: 'fade' | 'cut' | 'dissolve' | 'wipe' // 转场效果
}

export interface StoryboardSegment {
  id: string
  title: string
  description?: string
  frames: StoryboardFrame[]
}

export interface Storyboard {
  id: string
  storyArc: StoryArc
  segments: StoryboardSegment[]
  totalDuration: number // 总时长（秒）
  createdAt: Date
}

export interface GenerateStoryboardOptions {
  style: string
  seed: number
}
