'use client'

import { useState, useEffect } from 'react'
import { PhotoUpload } from '@/components/photo-upload/photo-upload'
import { createFeatureSpaceStore } from '@/lib/feature-space/feature-space'
import { extractAllFeatures } from '@/lib/feature-extraction/feature-extraction'
import { generateStoryArc } from '@/lib/story-arc/story-arc'
import { downloadFile, copyToClipboard, exportToMarkdown, exportToJSON, exportToPlainText, generateFileName } from '@/lib/storyboard/export'
import type { Photo, PhotoFeatures } from '@/lib/feature-space/feature-space'
import type { StoryArc, StoryStyle, StyleSuggestion } from '@/lib/story-arc/story-arc'
import type { Storyboard } from '@/lib/storyboard/storyboard'

const store = createFeatureSpaceStore()
const MAX_PHOTOS = 10
const MIN_PHOTOS_FOR_STORY = 3  // 至少需要3张照片才能生成故事
const MAX_RETRIES = 3

// Helper to get all editable keys from PhotoFeatures
function getEditableKeys(feature: PhotoFeatures): string[] {
  return Object.keys(feature).filter(key => key !== 'photoId')
}

// Helper to format key for display
function formatKey(key: string): string {
  const keyMap: Record<string, string> = {
    location: '地点',
    scene_type: '场景类型',
    setting_description: '场景描述',
    time_of_day: '时间',
    season: '季节',
    weather: '天气',
    people_count: '人数',
    people_descriptions: '人物描述',
    expressions: '表情',
    poses: '姿态',
    relationships: '关系',
    emotion: '情感',
    mood: '氛围',
    atmosphere: '氛围描述',
    events: '活动',
    context: '场合',
    objects: '物品',
    background_elements: '背景元素',
    foreground_elements: '前景元素',
    colors: '色调',
    lighting: '光线',
    perspective: '视角',
    composition: '构图',
    camera_angle: '拍摄角度',
    style: '风格',
    aesthetic_keywords: '美学关键词',
    soundscape: '声景',
    temperature: '温度',
    textures: '质感',
    story_hint: '故事暗示',
    moment_significance: '时刻意义',
  }
  return keyMap[key] || key
}

// Helper to translate English values to Chinese
function translateValue(key: string, value: unknown): string {
  if (value === null || value === undefined) return ''

  const strValue = String(value)

  // Scene type translations
  if (key === 'scene_type') {
    const sceneMap: Record<string, string> = {
      'indoor': '室内', 'outdoor': '室外', 'city': '城市', 'nature': '自然',
      'beach': '海滩', 'mountain': '山', 'street': '街道', 'indoor-home': '家中',
      'indoor-restaurant': '餐厅', 'park': '公园', 'forest': '森林', 'desert': '沙漠'
    }
    if (Array.isArray(value)) {
      return value.map(v => sceneMap[String(v)] || String(v)).join(', ')
    }
    return sceneMap[strValue] || strValue
  }

  // Time of day translations
  if (key === 'time_of_day') {
    const timeMap: Record<string, string> = {
      'morning': '早晨', 'noon': '中午', 'afternoon': '下午', 'dusk': '黄昏', 'night': '夜晚'
    }
    return timeMap[strValue] || strValue
  }

  // Season translations
  if (key === 'season') {
    const seasonMap: Record<string, string> = {
      'spring': '春天', 'summer': '夏天', 'autumn': '秋天', 'winter': '冬天'
    }
    return seasonMap[strValue] || strValue
  }

  // Weather translations
  if (key === 'weather') {
    const weatherMap: Record<string, string> = {
      'sunny': '晴天', 'cloudy': '阴天', 'rainy': '雨天', 'snowy': '雪天', 'foggy': '雾天'
    }
    return weatherMap[strValue] || strValue
  }

  // Relationship translations
  if (key === 'relationships' && Array.isArray(value)) {
    const relationMap: Record<string, string> = {
      'couple': '情侣', 'family': '家人', 'friends': '朋友', 'colleagues': '同事', 'strangers': '陌生人'
    }
    return value.map(v => relationMap[String(v)] || String(v)).join(', ')
  }

  // Context translations
  if (key === 'context') {
    const contextMap: Record<string, string> = {
      'travel': '旅游', 'party': '聚会', 'work': '工作', 'daily': '日常', 'sports': '运动'
    }
    return contextMap[strValue] || strValue
  }

  // Mood translations
  if (key === 'mood') {
    const moodMap: Record<string, string> = {
      'lively': '热闹', 'quiet': '安静', 'romantic': '浪漫', 'cozy': '温馨', 'tense': '紧张', 'lonely': '孤独'
    }
    return moodMap[strValue] || strValue
  }

  // Emotion translations
  if (key === 'emotion') {
    const emotionMap: Record<string, string> = {
      'joy': '快乐', 'sadness': '悲伤', 'love': '爱', 'excitement': '兴奋', 'calm': '平静', 'surprise': '惊讶'
    }
    return emotionMap[strValue] || strValue
  }

  // Moment significance translations
  if (key === 'moment_significance') {
    const momentMap: Record<string, string> = {
      'daily': '日常', 'celebration': '庆祝', 'memorable': '纪念', 'adventure': '探险'
    }
    return momentMap[strValue] || strValue
  }

  // Perspective translations
  if (key === 'perspective') {
    const perspectiveMap: Record<string, string> = {
      'first person': '第一人称', 'third person': '第三人称', 'top down': '俯视', 'bottom up': '仰视', 'eye level': '平视'
    }
    return perspectiveMap[strValue.toLowerCase()] || strValue
  }

  // Composition translations
  if (key === 'composition') {
    const compMap: Record<string, string> = {
      'portrait': '人像', 'landscape': '风景', 'close up': '特写', 'wide angle': '全景', 'group shot': '合影'
    }
    return compMap[strValue.toLowerCase()] || strValue
  }

  // Style translations
  if (key === 'style') {
    const styleMap: Record<string, string> = {
      'vintage': '复古', 'modern': '现代', 'minimalist': '极简', 'bright': '鲜艳', 'artistic': '艺术', 'black and white': '黑白'
    }
    return styleMap[strValue.toLowerCase()] || strValue
  }

  // Lighting translations
  if (key === 'lighting') {
    const lightingMap: Record<string, string> = {
      'natural light': '自然光', 'indoor warm light': '室内暖光', 'neon': '霓虹灯', 'backlight': '逆光', 'soft light': '柔光'
    }
    return lightingMap[strValue.toLowerCase()] || strValue
  }

  // Temperature translations
  if (key === 'temperature') {
    const tempMap: Record<string, string> = {
      'hot': '炎热', 'warm': '温暖', 'cool': '凉爽', 'cold': '寒冷'
    }
    return tempMap[strValue] || strValue
  }

  // For arrays and other values, return as-is
  if (Array.isArray(value)) {
    return value.join(', ')
  }
  return strValue
}

// Helper to format value for display/editing (returns raw value for editing)
function formatValue(value: unknown): string {
  if (Array.isArray(value)) {
    return value.join(', ')
  }
  if (typeof value === 'number') {
    return value.toString()
  }
  return String(value ?? '')
}

// Helper to parse edited value back to correct type
function parseValue(key: string, value: string): unknown {
  if (key === 'people_count') {
    const num = parseInt(value, 10)
    return isNaN(num) ? 0 : num
  }
  if (['events', 'objects', 'people_descriptions', 'expressions', 'poses', 'relationships',
       'background_elements', 'foreground_elements', 'colors', 'textures', 'aesthetic_keywords'].includes(key)) {
    return value.split(',').map(s => s.trim()).filter(Boolean)
  }
  return value || undefined
}

export default function Home() {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [features, setFeatures] = useState<PhotoFeatures[]>([])
  const [extracting, setExtracting] = useState(false)
  const [progress, setProgress] = useState({ current: 0, total: 0 })
  const [expandedPhotos, setExpandedPhotos] = useState<Set<string>>(new Set())
  const [editingPhoto, setEditingPhoto] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<Record<string, unknown>>({})
  const [unsavedChanges, setUnsavedChanges] = useState<Set<string>>(new Set())
  const [failedExtractions, setFailedExtractions] = useState<Set<string>>(new Set())
  const [processingComplete, setProcessingComplete] = useState(false)
  const [isAppending, setIsAppending] = useState(false)
  const [storyArc, setStoryArc] = useState<StoryArc | null>(null)
  const [activeTab, setActiveTab] = useState<'features' | 'story'>('features')
  const [styleSuggestions, setStyleSuggestions] = useState<StyleSuggestion[]>([])
  const [selectedStyle, setSelectedStyle] = useState<StoryStyle>('')
  const [customStyleInput, setCustomStyleInput] = useState('')
  const [loadingStyles, setLoadingStyles] = useState(false)
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null)
  const [storyboard, setStoryboard] = useState<Storyboard | null>(null)
  const [generatingStoryboard, setGeneratingStoryboard] = useState(false)
  const [isGeneratingNewStory, setIsGeneratingNewStory] = useState(false) // 区分"生成故事"还是"更新叙事脚本"
  const [editingFrameId, setEditingFrameId] = useState<string | null>(null)
  const [editingFrameData, setEditingFrameData] = useState<{ narration: string; duration: number; transition: string | undefined }>({ narration: '', duration: 2, transition: undefined })
  // 存储智能排序后的照片顺序（仅在故事tab中使用）
  const [orderedPhotos, setOrderedPhotos] = useState<Photo[]>([])
  const [orderedFeatures, setOrderedFeatures] = useState<PhotoFeatures[]>([])
  // 导出相关状态
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false)
  const [exportingFormat, setExportingFormat] = useState<'markdown' | 'json' | 'text' | null>(null)
  const [copiedFormat, setCopiedFormat] = useState<'markdown' | 'json' | 'text' | null>(null)

  // 键盘事件：ESC 关闭预览
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && previewPhoto) {
        setPreviewPhoto(null)
      }
    }

    if (previewPhoto) {
      window.addEventListener('keydown', handleKeyDown)
      return () => {
        window.removeEventListener('keydown', handleKeyDown)
      }
    }
  }, [previewPhoto])

  // 点击外部关闭导出下拉菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportDropdownOpen) {
        const target = event.target as HTMLElement
        const dropdown = document.querySelector('[data-export-dropdown]')
        if (dropdown && !dropdown.contains(target)) {
          setExportDropdownOpen(false)
        }
      }
    }

    if (exportDropdownOpen) {
      document.addEventListener('click', handleClickOutside)
      return () => {
        document.removeEventListener('click', handleClickOutside)
      }
    }
  }, [exportDropdownOpen])

  const handlePhotosReady = (uploadedPhotos: Photo[]) => {
    // 保护：如果收到空数组且当前有照片，忽略这次调用
    if (uploadedPhotos.length === 0 && photos.length > 0) {
      return
    }

    // Find new photos that weren't in the previous list
    const existingPhotoIds = new Set(photos.map(p => p.id))
    const newPhotos = uploadedPhotos.filter(p => !existingPhotoIds.has(p.id))

    setPhotos(uploadedPhotos)
    store.dispatch({ type: 'addPhotos', photos: uploadedPhotos })
    setProcessingComplete(false)
    setFailedExtractions(new Set())

    // 初始化orderedPhotos（首次上传时）
    if (orderedPhotos.length === 0) {
      setOrderedPhotos(uploadedPhotos)
      // orderedFeatures会在特征提取完成后更新
    }

    // Only extract features for new photos
    if (newPhotos.length > 0) {
      // Use append mode only if we already have extracted features
      const isAppend = features.length > 0
      extractFeatures(newPhotos, isAppend)
    }
  }

  const extractFeatures = async (photosToExtract: Photo[], append: boolean = false) => {
    // Show results immediately if we already have some (append mode or existing features)
    const hasExistingResults = append || features.length > 0

    setExtracting(!hasExistingResults)
    setIsAppending(append && features.length > 0) // Mark as appending if we have existing results
    setProcessingComplete(false)
    setProgress({ current: 0, total: photosToExtract.length })
    setFailedExtractions(new Set())

    try {
      const result = await extractAllFeatures(
        photosToExtract,
        (current, total) => {
          setProgress({ current, total })
        }
      )

      // Handle failed extractions
      if (result.failedPhotoIds.length > 0) {
        setFailedExtractions(new Set(result.failedPhotoIds))
        console.warn('Failed to extract features for photos:', result.failedPhotoIds)
      }

      if (append) {
        // Merge new features with existing ones - use prev to get latest state
        setFeatures(prev => {
          const merged = [...prev, ...result.features]
          store.dispatch({ type: 'setFeatures', features: merged })
          return merged
        })
        // 同步更新orderedFeatures
        setOrderedFeatures(prev => {
          const merged = [...prev, ...result.features]
          return merged
        })
      } else {
        setFeatures(result.features)
        store.dispatch({ type: 'setFeatures', features: result.features })
        // 首次提取时，同步更新orderedFeatures
        setOrderedFeatures(result.features)
      }

      console.log('Extracted features:', result.features)
      console.log('Failed extractions:', result.failedPhotoIds)

      // 特征提取完成后，获取风格推荐
      if (result.features.length >= MIN_PHOTOS_FOR_STORY) {
        fetchStyleSuggestions(result.features)
      }
    } catch (error) {
      console.error('Extraction error:', error)
    } finally {
      setExtracting(false)
      setIsAppending(false)
      setProcessingComplete(true)
    }
  }

  const fetchStyleSuggestions = async (features: PhotoFeatures[]) => {
    if (features.length < MIN_PHOTOS_FOR_STORY) return

    setLoadingStyles(true)
    try {
      const response = await fetch('/api/suggest-styles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ features }),
      })

      if (!response.ok) {
        throw new Error('Failed to fetch style suggestions')
      }

      const data = await response.json()
      setStyleSuggestions(data.suggestions || [])

      // 默认选择第一个推荐
      if (data.suggestions?.[0]) {
        setSelectedStyle(data.suggestions[0].name)
      }
    } catch (error) {
      console.error('Failed to fetch style suggestions:', error)
      // 降级使用默认风格
      setStyleSuggestions([{ id: 'default', name: '温馨回忆', reason: '经典的故事风格' }])
      setSelectedStyle('温馨回忆')
    } finally {
      setLoadingStyles(false)
    }
  }

  const toggleExpand = (photoId: string) => {
    setExpandedPhotos((prev) => {
      const next = new Set(prev)
      if (next.has(photoId)) {
        next.delete(photoId)
      } else {
        next.add(photoId)
      }
      return next
    })
  }

  const startEditing = (photoId: string) => {
    const feature = features.find(f => f.photoId === photoId)
    if (!feature) return

    setEditingPhoto(photoId)
    setEditValues({ ...feature })
  }

  const cancelEditing = () => {
    setEditingPhoto(null)
    setEditValues({})
  }

  const saveEdits = () => {
    if (!editingPhoto) return

    setFeatures(prev => prev.map(f =>
      f.photoId === editingPhoto ? { ...f, ...editValues, photoId: f.photoId } as PhotoFeatures : f
    ))

    store.dispatch({ type: 'updateFeature', photoId: editingPhoto, feature: editValues })

    setUnsavedChanges(prev => {
      const next = new Set(prev)
      next.delete(editingPhoto)
      return next
    })

    setEditingPhoto(null)
    setEditValues({})
  }

  const handleEditChange = (key: string, value: unknown) => {
    setEditValues(prev => ({ ...prev, [key]: value }))
    setUnsavedChanges(prev => new Set(prev).add(editingPhoto!))
  }

  const deletePhoto = (photoId: string) => {
    if (!confirm('确定要删除这张照片吗？')) return

    // Update photos first
    const updatedPhotos = photos.filter(p => p.id !== photoId)
    setPhotos(updatedPhotos)

    // Update features using the latest state
    setFeatures(prev => {
      const updatedFeatures = prev.filter(f => f.photoId !== photoId)
      store.dispatch({ type: 'setFeatures', features: updatedFeatures })
      return updatedFeatures
    })

    // Update ordered photos and features
    setOrderedPhotos(prev => prev.filter(p => p.id !== photoId))
    setOrderedFeatures(prev => prev.filter(f => f.photoId !== photoId))

    setExpandedPhotos(prev => {
      const next = new Set(prev)
      next.delete(photoId)
      return next
    })
    setUnsavedChanges(prev => {
      const next = new Set(prev)
      next.delete(photoId)
      return next
    })
    setFailedExtractions(prev => {
      const next = new Set(prev)
      next.delete(photoId)
      return next
    })

    store.dispatch({ type: 'addPhotos', photos: updatedPhotos })
  }

  const retryPhoto = async (photoId: string) => {
    const photo = photos.find(p => p.id === photoId)
    if (!photo) return

    setExtracting(true)
    setFailedExtractions(prev => {
      const next = new Set(prev)
      next.delete(photoId)
      return next
    })

    try {
      const result = await extractAllFeatures([photo], undefined, 1)

      if (result.failedPhotoIds.includes(photoId)) {
        setFailedExtractions(prev => new Set(prev).add(photoId))
      } else if (result.features.length > 0) {
        setFeatures(prev => {
          const exists = prev.find(f => f.photoId === photoId)
          if (exists) {
            return prev.map(f => f.photoId === photoId ? result.features[0] : f)
          }
          return [...prev, result.features[0]]
        })
        store.dispatch({ type: 'updateFeature', photoId, feature: result.features[0] })
      }
    } catch (error) {
      console.error('Retry error:', error)
      setFailedExtractions(prev => new Set(prev).add(photoId))
    } finally {
      setExtracting(false)
    }
  }

  /**
   * 生成故事的主函数
   * @param skipReorder 是否跳过智能排序（"更新叙事脚本"时跳过，"生成故事"时不跳过）
   */
  const handleGenerateStory = async (skipReorder = false) => {
    if (features.length < MIN_PHOTOS_FOR_STORY) return

    const style = selectedStyle === 'custom' ? customStyleInput : selectedStyle
    if (!style || style === 'custom') {
      alert('请选择或输入故事风格')
      return
    }

    try {
      let workingPhotos = [...photos]
      let workingFeatures = [...features]

      // ========== "生成故事"：完整重置 ==========
      // 1. AI智能排序照片顺序
      // 2. 清除旧数据
      // 3. AI重新评估最佳叙事结构（时间线/情感线/主题线）
      // 4. 重新生成分段和叙事脚本

      // 生成统一的seed，用于所有随机操作
      const seed = Date.now()

      // 设置生成状态：区分"生成故事"和"更新叙事脚本"
      setIsGeneratingNewStory(!skipReorder)

      if (!skipReorder) {
        setGeneratingStoryboard(true)

        const reorderResponse = await fetch('/api/reorder-photos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            photos: workingPhotos,
            features: workingFeatures,
            style,
            seed,
          }),
        })

        if (reorderResponse.ok) {
          const reorderData = await reorderResponse.json()

          const photoMap = new Map(workingPhotos.map(p => [p.id, p]))
          const featureMap = new Map(workingFeatures.map(f => [f.photoId, f]))

          // 重新排序后的照片和特征（用于生成分段和叙事）
          workingPhotos = reorderData.reorderedPhotoIds.map((id: string) => photoMap.get(id)).filter(Boolean)
          workingFeatures = reorderData.reorderedPhotoIds.map((id: string) => featureMap.get(id)).filter(Boolean)

          // 存储排序后的顺序，供故事tab使用
          setOrderedPhotos(workingPhotos)
          setOrderedFeatures(workingFeatures)
        } else {
          // 如果排序失败，使用原始顺序
          setOrderedPhotos(workingPhotos)
          setOrderedFeatures(workingFeatures)
        }

        // 清除旧数据，强制重新生成分段结构
        setStoryboard(null)
        setStoryArc(null)
      }

      // ========== 每次都会执行的部分 ==========
      let arc: StoryArc
      let segmentsForStoryboard: any[]

      if (skipReorder && storyArc) {
        // "更新叙事脚本"：使用现有的分段结构，不重新生成
        arc = storyArc
        segmentsForStoryboard = storyArc.segments
        // 使用原始的photos和features，让API通过segment.photoIds查找
        // 不使用orderedPhotos和orderedFeatures，以避免顺序不匹配
      } else {
        // "生成故事"：AI自动评估照片特征，选择最佳叙事结构
        arc = generateStoryArc(workingFeatures, {
          style,
          seed,
        })
        setStoryArc(arc)
        segmentsForStoryboard = arc.segments
      }

      // 生成叙事脚本
      setGeneratingStoryboard(true)
      const response = await fetch('/api/generate-storyboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          photos: workingPhotos,
          features: workingFeatures,
          segments: segmentsForStoryboard,
          style,
          seed,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate storyboard')
      }

      const storyboardData = await response.json()

      setStoryboard({
        ...storyboardData,
        storyArc: arc,
        createdAt: new Date(),
      })

      setActiveTab('story')
    } catch (error) {
      console.error('Error generating story:', error)
      alert('生成故事失败，请重试')
    } finally {
      setGeneratingStoryboard(false)
      setIsGeneratingNewStory(false)
    }
  }

  /**
   * "更新叙事脚本"：只重新生成叙事内容，保持照片顺序和分段结构
   */
  const handleRegenerateStory = () => {
    handleGenerateStory(true) // skipReorder = true，跳过智能排序和分段重置
  }

  // 开始编辑帧
  const startEditingFrame = (frameId: string, narration: string, duration: number, transition: string | undefined) => {
    setEditingFrameId(frameId)
    setEditingFrameData({ narration, duration, transition })
  }

  // 取消编辑
  const cancelEditingFrame = () => {
    setEditingFrameId(null)
    setEditingFrameData({ narration: '', duration: 2, transition: undefined })
  }

  // 保存帧编辑
  const saveFrameEdit = () => {
    if (!editingFrameId || !storyboard) return

    // 深拷贝 storyboard 并更新指定的 frame
    const updatedStoryboard = {
      ...storyboard,
      segments: storyboard.segments.map(segment => ({
        ...segment,
        frames: segment.frames.map(frame =>
          frame.id === editingFrameId
            ? { ...frame, narration: editingFrameData.narration, duration: editingFrameData.duration, transition: editingFrameData.transition }
            : frame
        )
      }))
    }

    setStoryboard(updatedStoryboard)
    setEditingFrameId(null)
    setEditingFrameData({ narration: '', duration: 2, transition: undefined })
  }

  const getStructureName = (structure: string): string => {
    const names: Record<string, string> = {
      'chronological': '时间线',
      'emotional': '情感线',
      'thematic': '主题线'
    }
    return names[structure] || structure
  }

  // 导出处理函数
  const handleExport = async (format: 'markdown' | 'json' | 'text') => {
    if (!storyboard) return

    setExportingFormat(format)
    setExportDropdownOpen(false)

    let content: string
    let filename: string
    let mimeType: string

    switch (format) {
      case 'markdown':
        content = exportToMarkdown(storyboard)
        filename = generateFileName('markdown')
        mimeType = 'text/markdown'
        break
      case 'json':
        content = exportToJSON(storyboard)
        filename = generateFileName('json')
        mimeType = 'application/json'
        break
      case 'text':
        content = exportToPlainText(storyboard)
        filename = generateFileName('text')
        mimeType = 'text/plain'
        break
    }

    downloadFile(content, filename, mimeType)
  }

  const handleCopy = async (format: 'markdown' | 'json' | 'text') => {
    if (!storyboard) return

    let content: string

    switch (format) {
      case 'markdown':
        content = exportToMarkdown(storyboard)
        break
      case 'json':
        content = exportToJSON(storyboard)
        break
      case 'text':
        content = exportToPlainText(storyboard)
        break
    }

    const success = await copyToClipboard(content)
    if (success) {
      setCopiedFormat(format)
      setTimeout(() => setCopiedFormat(null), 2000)
    }
  }

  const isExpanded = (photoId: string) => expandedPhotos.has(photoId)
  const isEditing = (photoId: string) => editingPhoto === photoId
  const hasUnsavedChanges = (photoId: string) => unsavedChanges.has(photoId)

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <main className="max-w-4xl mx-auto py-16 px-4">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">
            记忆故事生成器
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            上传照片，开始创建你的故事
          </p>
        </div>

        <PhotoUpload
          photos={photos}
          onPhotosReady={handlePhotosReady}
          onPhotoDelete={deletePhoto}
          onPhotoPreview={setPreviewPhoto}
          maxPhotos={MAX_PHOTOS}
        />

        {/* 首次上传处理状态 */}
        {extracting && features.length === 0 && (
          <div className="mt-8 bg-white dark:bg-zinc-900 rounded-lg p-6 shadow-sm">
            <div className="flex flex-col items-center justify-center gap-4">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <div className="text-center">
                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  正在分析照片...
                </p>
                <p className="text-xs text-zinc-500">
                  {progress.current} / {progress.total}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 追加照片处理状态 - 简化版 */}
        {isAppending && !extracting && (
          <div className="mt-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg px-4 py-2">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-blue-700 dark:text-blue-400">
                正在处理新照片... ({progress.current}/{progress.total})
              </span>
            </div>
          </div>
        )}

        {failedExtractions.size > 0 && !extracting && (
          <div className="mt-8 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-red-700 dark:text-red-400">
                  ⚠️ {failedExtractions.size} 张照片分析失败
                </p>
                <p className="text-xs text-red-600 dark:text-red-500 mt-1">
                  可能原因：网络问题或照片格式不支持
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const failedPhotos = photos.filter(p => failedExtractions.has(p.id))
                    if (failedPhotos.length > 0) {
                      // 使用 append 模式重试，避免丢失已成功的结果
                      extractFeatures(failedPhotos, true)
                    }
                  }}
                  className="px-3 py-1.5 text-sm font-medium text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 rounded-lg transition-colors"
                >
                  重试
                </button>
                <button
                  onClick={() => {
                    if (!confirm(`确定要删除这 ${failedExtractions.size} 张失败的照片吗？`)) return
                    const failedIds = Array.from(failedExtractions)
                    failedIds.forEach(id => deletePhoto(id))
                    setFailedExtractions(new Set())
                  }}
                  className="px-3 py-1.5 text-sm font-medium text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg transition-colors"
                >
                  删除失败的照片
                </button>
              </div>
            </div>
          </div>
        )}

        {features.length > 0 && !extracting && (
          <div className="mt-8">
            {/* Tab 导航和操作栏 */}
            <div className="flex items-center justify-between mb-4">
              {/* Tab 导航 */}
              <div className="flex gap-1">
                <button
                  onClick={() => setActiveTab('features')}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === 'features'
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                      : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
                  }`}
                >
                  照片 ({features.length})
                </button>
                {storyArc && (
                  <button
                    onClick={() => setActiveTab('story')}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                      activeTab === 'story'
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                        : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
                    }`}
                  >
                    故事 ({storyArc.segments.length}章)
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3">
                {/* AI推荐的风格选择 */}
                {loadingStyles ? (
                  <div className="px-3 py-2 text-sm text-zinc-500">正在推荐风格...</div>
                ) : styleSuggestions.length > 0 ? (
                  <select
                    value={selectedStyle}
                    onChange={(e) => setSelectedStyle(e.target.value)}
                    className="px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    {styleSuggestions.map((suggestion) => (
                      <option key={suggestion.id} value={suggestion.name}>
                        {suggestion.name}
                      </option>
                    ))}
                    <option value="custom">✨ 自定义风格</option>
                  </select>
                ) : (
                  <div className="px-3 py-2 text-sm text-zinc-500">等待特征提取完成...</div>
                )}

                {/* 自定义输入 - 只在选择自定义时显示 */}
                {selectedStyle === 'custom' && (
                  <input
                    type="text"
                    value={customStyleInput}
                    onChange={(e) => setCustomStyleInput(e.target.value)}
                    placeholder="描述你想要的故事风格..."
                    className="px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-purple-500 w-64"
                  />
                )}

                <button
                  onClick={() => handleGenerateStory(false)}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  disabled={
                    generatingStoryboard ||
                    unsavedChanges.size > 0 ||
                    failedExtractions.size > 0 ||
                    features.length < MIN_PHOTOS_FOR_STORY ||
                    !selectedStyle ||
                    (selectedStyle === 'custom' && !customStyleInput.trim())
                  }
                >
                  {generatingStoryboard && (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  )}
                  {generatingStoryboard
                    ? '正在生成...'
                    : features.length < MIN_PHOTOS_FOR_STORY
                    ? `至少需要 ${MIN_PHOTOS_FOR_STORY} 张照片`
                    : unsavedChanges.size > 0
                    ? `请先保存 ${unsavedChanges.size} 项修改`
                    : failedExtractions.size > 0
                    ? `请先处理 ${failedExtractions.size} 张失败照片`
                    : '生成故事'
                  }
                </button>
              </div>
            </div>

            {/* 风格推荐理由 */}
            {!loadingStyles && styleSuggestions.length > 0 && (
              <div className="mb-4 p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                <p className="text-sm text-purple-700 dark:text-purple-400">
                  {selectedStyle === 'custom'
                    ? `✨ 自定义风格: ${customStyleInput || '描述你想要的故事风格...'}`
                    : `💡 ${styleSuggestions.find(s => s.name === selectedStyle)?.reason || '选择一个风格开始生成故事'}`
                  }
                </p>
              </div>
            )}

            {/* 工作区内容 */}
            <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-700">
              {activeTab === 'features' && (
                <div className="p-6">
                  {features.map((feature, index) => {
                const expanded = isExpanded(feature.photoId)
                const editing = isEditing(feature.photoId)
                const unsaved = hasUnsavedChanges(feature.photoId)

                return (
                  <div
                    key={feature.photoId}
                    className={`border rounded-lg overflow-hidden transition-all ${
                      unsaved ? 'border-orange-400 dark:border-orange-500 shadow-sm shadow-orange-100 dark:shadow-orange-900/20' : 'border-zinc-200 dark:border-zinc-700'
                    }`}
                  >
                    {/* Header */}
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <img
                          src={photos[index]?.url}
                          alt={`Photo ${index + 1}`}
                          className="w-20 h-20 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => setPreviewPhoto(photos[index]?.url || null)}
                        />
                        <div className="flex items-center gap-2">
                          {editing ? (
                            <>
                              <button
                                onClick={saveEdits}
                                className="px-3 py-1.5 text-sm font-medium text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                              >
                                保存
                              </button>
                              <button
                                onClick={cancelEditing}
                                className="px-3 py-1.5 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                              >
                                取消
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => startEditing(feature.photoId)}
                                className="px-3 py-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                              >
                                编辑
                              </button>
                              <button
                                onClick={() => toggleExpand(feature.photoId)}
                                className="px-3 py-1.5 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                              >
                                {expanded ? '收起 ▲' : '展开 ▼'}
                              </button>
                              <button
                                onClick={() => deletePhoto(feature.photoId)}
                                className="px-3 py-1.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                              >
                                删除
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                      {unsaved && (
                        <div className="mt-2 text-xs text-orange-600 dark:text-orange-400">
                          ⚠️ 有未保存的修改
                        </div>
                      )}
                    </div>

                    {/* Main features */}
                    <div className="px-4 pb-4">
                      {editing ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          {getEditableKeys(feature).map(key => (
                            <div key={key} className="space-y-1">
                              <label className="font-semibold text-zinc-800 dark:text-zinc-200 text-xs">{formatKey(key)}</label>
                              <input
                                type="text"
                                value={formatValue(editValues[key] ?? '')}
                                onChange={(e) => handleEditChange(key, parseValue(key, e.target.value))}
                                className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-900 dark:text-zinc-100"
                              />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="space-y-2 text-sm">
                          {feature.location && (
                            <div className="flex items-baseline gap-2">
                              <span className="font-semibold text-zinc-700 dark:text-zinc-200">地点:</span>
                              <span className="text-zinc-600 dark:text-zinc-400">{translateValue('location', feature.location)}</span>
                            </div>
                          )}
                          {feature.scene_type && (
                            <div className="flex items-baseline gap-2">
                              <span className="font-semibold text-zinc-700 dark:text-zinc-200">场景:</span>
                              <span className="text-zinc-600 dark:text-zinc-400">{translateValue('scene_type', feature.scene_type)}</span>
                            </div>
                          )}
                          {feature.time_of_day && (
                            <div className="flex items-baseline gap-2">
                              <span className="font-semibold text-zinc-700 dark:text-zinc-200">时间:</span>
                              <span className="text-zinc-600 dark:text-zinc-400">{translateValue('time_of_day', feature.time_of_day)}</span>
                            </div>
                          )}
                          {feature.people_count !== undefined && (
                            <div className="flex items-baseline gap-2">
                              <span className="font-semibold text-zinc-700 dark:text-zinc-200">人数:</span>
                              <span className="text-zinc-600 dark:text-zinc-400">{feature.people_count}人</span>
                            </div>
                          )}
                          {feature.emotion && (
                            <div className="flex items-baseline gap-2">
                              <span className="font-semibold text-zinc-700 dark:text-zinc-200">情感:</span>
                              <span className="text-zinc-600 dark:text-zinc-400">{translateValue('emotion', feature.emotion)}</span>
                            </div>
                          )}
                          {feature.events && feature.events.length > 0 && (
                            <div className="flex items-baseline gap-2">
                              <span className="font-semibold text-zinc-700 dark:text-zinc-200">活动:</span>
                              <span className="text-zinc-600 dark:text-zinc-400">{translateValue('events', feature.events)}</span>
                            </div>
                          )}
                          {feature.objects && feature.objects.length > 0 && (
                            <div className="flex items-baseline gap-2">
                              <span className="font-semibold text-zinc-700 dark:text-zinc-200">物品:</span>
                              <span className="text-zinc-600 dark:text-zinc-400">{feature.objects.slice(0, 3).join(', ')}{feature.objects.length > 3 ? '...' : ''}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Detailed features (expandable, not editable in this view) */}
                    {expanded && !editing && (
                      <div className="px-4 pb-4 border-t border-zinc-200 dark:border-zinc-700 pt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                          {/* Scene Details */}
                          {(feature.setting_description || feature.season || feature.weather) && (
                            <div className="space-y-2">
                              <p className="font-semibold text-zinc-900 dark:text-zinc-50 text-sm">场景详情</p>
                              {feature.setting_description && (
                                <div className="space-y-1">
                                  <p className="font-semibold text-zinc-800 dark:text-zinc-200 text-xs">描述</p>
                                  <p className="text-zinc-600 dark:text-zinc-400">{feature.setting_description}</p>
                                </div>
                              )}
                              {feature.season && (
                                <div className="space-y-1">
                                  <p className="font-semibold text-zinc-800 dark:text-zinc-200 text-xs">季节</p>
                                  <p className="text-zinc-600 dark:text-zinc-400">{translateValue('season', feature.season)}</p>
                                </div>
                              )}
                              {feature.weather && (
                                <div className="space-y-1">
                                  <p className="font-semibold text-zinc-800 dark:text-zinc-200 text-xs">天气</p>
                                  <p className="text-zinc-600 dark:text-zinc-400">{translateValue('weather', feature.weather)}</p>
                                </div>
                              )}
                            </div>
                          )}

                          {/* People Details */}
                          {(feature.people_descriptions?.length || feature.expressions?.length || feature.poses?.length || feature.relationships?.length) && (
                            <div className="space-y-2">
                              <p className="font-semibold text-zinc-900 dark:text-zinc-50 text-sm">人物详情</p>
                              {feature.people_descriptions && feature.people_descriptions.length > 0 && (
                                <div className="space-y-1">
                                  <p className="font-semibold text-zinc-800 dark:text-zinc-200 text-xs">人物</p>
                                  <p className="text-zinc-600 dark:text-zinc-400">{feature.people_descriptions.join(', ')}</p>
                                </div>
                              )}
                              {feature.expressions && feature.expressions.length > 0 && (
                                <div className="space-y-1">
                                  <p className="font-semibold text-zinc-800 dark:text-zinc-200 text-xs">表情</p>
                                  <p className="text-zinc-600 dark:text-zinc-400">{feature.expressions.join(', ')}</p>
                                </div>
                              )}
                              {feature.poses && feature.poses.length > 0 && (
                                <div className="space-y-1">
                                  <p className="font-semibold text-zinc-800 dark:text-zinc-200 text-xs">姿态</p>
                                  <p className="text-zinc-600 dark:text-zinc-400">{feature.poses.join(', ')}</p>
                                </div>
                              )}
                              {feature.relationships && feature.relationships.length > 0 && (
                                <div className="space-y-1">
                                  <p className="font-semibold text-zinc-800 dark:text-zinc-200 text-xs">关系</p>
                                  <p className="text-zinc-600 dark:text-zinc-400">{translateValue('relationships', feature.relationships)}</p>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Mood Details */}
                          {(feature.mood || feature.atmosphere || feature.context) && (
                            <div className="space-y-2">
                              <p className="font-semibold text-zinc-900 dark:text-zinc-50 text-sm">氛围详情</p>
                              {feature.mood && (
                                <div className="space-y-1">
                                  <p className="font-semibold text-zinc-800 dark:text-zinc-200 text-xs">氛围</p>
                                  <p className="text-zinc-600 dark:text-zinc-400">{translateValue('mood', feature.mood)}</p>
                                </div>
                              )}
                              {feature.atmosphere && (
                                <div className="space-y-1">
                                  <p className="font-semibold text-zinc-800 dark:text-zinc-200 text-xs">氛围描述</p>
                                  <p className="text-zinc-600 dark:text-zinc-400">{feature.atmosphere}</p>
                                </div>
                              )}
                              {feature.context && (
                                <div className="space-y-1">
                                  <p className="font-semibold text-zinc-800 dark:text-zinc-200 text-xs">场合</p>
                                  <p className="text-zinc-600 dark:text-zinc-400">{translateValue('context', feature.context)}</p>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Visual Elements */}
                          {(feature.background_elements?.length || feature.foreground_elements?.length || feature.colors?.length || feature.lighting) && (
                            <div className="space-y-2">
                              <p className="font-semibold text-zinc-900 dark:text-zinc-50 text-sm">视觉元素</p>
                              {feature.colors && feature.colors.length > 0 && (
                                <div className="space-y-1">
                                  <p className="font-semibold text-zinc-800 dark:text-zinc-200 text-xs">色调</p>
                                  <p className="text-zinc-600 dark:text-zinc-400">{feature.colors.join(', ')}</p>
                                </div>
                              )}
                              {feature.lighting && (
                                <div className="space-y-1">
                                  <p className="font-semibold text-zinc-800 dark:text-zinc-200 text-xs">光线</p>
                                  <p className="text-zinc-600 dark:text-zinc-400">{translateValue('lighting', feature.lighting)}</p>
                                </div>
                              )}
                              {feature.background_elements && feature.background_elements.length > 0 && (
                                <div className="space-y-1">
                                  <p className="font-semibold text-zinc-800 dark:text-zinc-200 text-xs">背景</p>
                                  <p className="text-zinc-600 dark:text-zinc-400">{feature.background_elements.join(', ')}</p>
                                </div>
                              )}
                              {feature.foreground_elements && feature.foreground_elements.length > 0 && (
                                <div className="space-y-1">
                                  <p className="font-semibold text-zinc-800 dark:text-zinc-200 text-xs">前景</p>
                                  <p className="text-zinc-600 dark:text-zinc-400">{feature.foreground_elements.join(', ')}</p>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Composition & Style */}
                          {(feature.composition || feature.perspective || feature.style) && (
                            <div className="space-y-2">
                              <p className="font-semibold text-zinc-900 dark:text-zinc-50 text-sm">构图与风格</p>
                              {feature.composition && (
                                <div className="space-y-1">
                                  <p className="font-semibold text-zinc-800 dark:text-zinc-200 text-xs">构图</p>
                                  <p className="text-zinc-600 dark:text-zinc-400">{translateValue('composition', feature.composition)}</p>
                                </div>
                              )}
                              {feature.perspective && (
                                <div className="space-y-1">
                                  <p className="font-semibold text-zinc-800 dark:text-zinc-200 text-xs">视角</p>
                                  <p className="text-zinc-600 dark:text-zinc-400">{translateValue('perspective', feature.perspective)}</p>
                                </div>
                              )}
                              {feature.style && (
                                <div className="space-y-1">
                                  <p className="font-semibold text-zinc-800 dark:text-zinc-200 text-xs">风格</p>
                                  <p className="text-zinc-600 dark:text-zinc-400">{translateValue('style', feature.style)}</p>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Sensory */}
                          {(feature.soundscape || feature.temperature || feature.textures?.length) && (
                            <div className="space-y-2">
                              <p className="font-semibold text-zinc-900 dark:text-zinc-50 text-sm">感官体验</p>
                              {feature.soundscape && (
                                <div className="space-y-1">
                                  <p className="font-semibold text-zinc-800 dark:text-zinc-200 text-xs">声景</p>
                                  <p className="text-zinc-600 dark:text-zinc-400">{feature.soundscape}</p>
                                </div>
                              )}
                              {feature.temperature && (
                                <div className="space-y-1">
                                  <p className="font-semibold text-zinc-800 dark:text-zinc-200 text-xs">温度</p>
                                  <p className="text-zinc-600 dark:text-zinc-400">{translateValue('temperature', feature.temperature)}</p>
                                </div>
                              )}
                              {feature.textures && feature.textures.length > 0 && (
                                <div className="space-y-1">
                                  <p className="font-semibold text-zinc-800 dark:text-zinc-200 text-xs">质感</p>
                                  <p className="text-zinc-600 dark:text-zinc-400">{feature.textures.join(', ')}</p>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Narrative */}
                          {(feature.story_hint || feature.moment_significance || feature.aesthetic_keywords?.length) && (
                            <div className="space-y-2">
                              <p className="font-semibold text-zinc-900 dark:text-zinc-50 text-sm">叙事元素</p>
                              {feature.story_hint && (
                                <div className="space-y-1">
                                  <p className="font-semibold text-zinc-800 dark:text-zinc-200 text-xs">故事暗示</p>
                                  <p className="text-zinc-600 dark:text-zinc-400">{feature.story_hint}</p>
                                </div>
                              )}
                              {feature.moment_significance && (
                                <div className="space-y-1">
                                  <p className="font-semibold text-zinc-800 dark:text-zinc-200 text-xs">时刻意义</p>
                                  <p className="text-zinc-600 dark:text-zinc-400">{translateValue('moment_significance', feature.moment_significance)}</p>
                                </div>
                              )}
                              {feature.aesthetic_keywords && feature.aesthetic_keywords.length > 0 && (
                                <div className="space-y-1">
                                  <p className="font-semibold text-zinc-800 dark:text-zinc-200 text-xs">美学关键词</p>
                                  <p className="text-zinc-600 dark:text-zinc-400">{feature.aesthetic_keywords.join(', ')}</p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
              )}

              {activeTab === 'story' && storyArc && (
                <div className="p-6">
                  {/* "生成故事"时：只显示生成状态，隐藏故事列表 */}
                  {isGeneratingNewStory ? (
                    <div className="py-12 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
                        <div className="space-y-2">
                          <p className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
                            正在生成故事...
                          </p>
                          <p className="text-sm text-zinc-600 dark:text-zinc-400">
                            AI正在智能排序照片并生成分镜脚本
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* 故事操作栏 */}
                      <div className="flex items-center justify-between mb-6 pb-4 border-b border-zinc-200 dark:border-zinc-700">
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-zinc-600 dark:text-zinc-400">
                            叙事方式: <span className="font-medium text-zinc-900 dark:text-zinc-100">{getStructureName(storyArc.structure)}</span>
                          </span>
                          <span className="text-zinc-600 dark:text-zinc-400">
                            匹配度: <span className="font-medium text-zinc-900 dark:text-zinc-100">{(storyArc.confidence * 100).toFixed(0)}%</span>
                          </span>
                          <span className="text-zinc-600 dark:text-zinc-400">
                            风格: <span className="font-medium text-zinc-900 dark:text-zinc-100">{storyArc.options.style}</span>
                          </span>
                          {storyboard && (
                            <span className="text-zinc-600 dark:text-zinc-400">
                              总时长: <span className="font-medium text-zinc-900 dark:text-zinc-100">{storyboard.totalDuration}秒</span>
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={handleRegenerateStory}
                            className="px-3 py-1.5 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                          >
                            更新叙事脚本
                          </button>
                          <div className="relative" data-export-dropdown>
                            <button
                              onClick={() => setExportDropdownOpen(!exportDropdownOpen)}
                              className="px-3 py-1.5 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors flex items-center gap-1"
                            >
                              导出
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>
                            {exportDropdownOpen && (
                              <div className="absolute right-0 top-full mt-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg overflow-hidden z-10 min-w-[150px]">
                                <div className="py-1">
                                  <button
                                    onClick={() => handleExport('markdown')}
                                    className="block w-full text-left px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                                  >
                                    Markdown
                                  </button>
                                  <button
                                    onClick={() => handleExport('json')}
                                    className="block w-full text-left px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                                  >
                                    JSON
                                  </button>
                                  <button
                                    onClick={() => handleExport('text')}
                                    className="block w-full text-left px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                                  >
                                    纯文本
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* 生成故事板中提示（仅"更新叙事脚本"时显示） */}
                      {generatingStoryboard && !isGeneratingNewStory && (
                        <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                            <span className="text-sm text-blue-700 dark:text-blue-400">
                              正在更新叙事脚本...
                            </span>
                          </div>
                        </div>
                      )}

                      <div className="space-y-4">
                        {storyArc.segments.map((segment, index) => {
                          const storyboardSegment = storyboard?.segments.find(s => s.id === segment.id)
                          return (
                        <div
                          key={segment.id}
                          className="border border-zinc-200 dark:border-zinc-700 rounded-lg overflow-hidden"
                        >
                          {/* Segment header */}
                          <div className="bg-zinc-50 dark:bg-zinc-800 px-4 py-3 border-b border-zinc-200 dark:border-zinc-700">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <span className="flex items-center justify-center w-6 h-6 bg-blue-600 text-white text-xs font-medium rounded-full">
                                  {index + 1}
                                </span>
                                <h4 className="font-medium text-zinc-900 dark:text-zinc-50">{segment.title}</h4>
                              </div>
                              <span className="text-xs text-zinc-500">{segment.photoIds.length} 张照片</span>
                            </div>
                            {segment.description && (
                              <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">{segment.description}</p>
                            )}
                          </div>

                          {/* Segment frames with narrative */}
                          <div className="p-4 space-y-3">
                            {storyboardSegment?.frames && storyboardSegment.frames.length > 0 ? (
                              // 有 storyboard 数据，显示完整的帧信息
                              storyboardSegment.frames.map((frame, frameIndex) => {
                                // 故事tab使用智能排序后的顺序
                                const photo = (orderedPhotos.length > 0 ? orderedPhotos : photos).find(p => p.id === frame.photoId)
                                const isEditing = editingFrameId === frame.id
                                return photo ? (
                                  <div
                                    key={frame.id}
                                    className={`flex gap-4 p-3 rounded-lg transition-all ${
                                      isEditing
                                        ? 'bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-300 dark:border-blue-700'
                                        : 'bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                                    }`}
                                  >
                                    <img
                                      src={photo.url}
                                      alt={`Frame ${frameIndex + 1}`}
                                      className="w-24 h-24 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity flex-shrink-0"
                                      onClick={() => setPreviewPhoto(photo.url)}
                                    />
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-start justify-between gap-2 mb-2">
                                        <span className="text-xs font-medium text-zinc-500">第 {frameIndex + 1} 镜</span>
                                        <div className="flex items-center gap-2">
                                          {!isEditing && !generatingStoryboard && (
                                            <button
                                              onClick={() => startEditingFrame(frame.id, frame.narration, frame.duration, frame.transition || '')}
                                              className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                                            >
                                              编辑
                                            </button>
                                          )}
                                          {isEditing && (
                                            <div className="flex items-center gap-2">
                                              <button
                                                onClick={saveFrameEdit}
                                                className="text-xs text-green-600 dark:text-green-400 hover:underline"
                                              >
                                                保存
                                              </button>
                                              <button
                                                onClick={cancelEditingFrame}
                                                className="text-xs text-zinc-600 dark:text-zinc-400 hover:underline"
                                              >
                                                取消
                                              </button>
                                            </div>
                                          )}
                                        </div>
                                      </div>

                                      {isEditing ? (
                                        // 编辑模式
                                        <div className="space-y-3">
                                          <div>
                                            <label className="text-xs text-zinc-600 dark:text-zinc-400">叙事描述</label>
                                            <textarea
                                              value={editingFrameData.narration}
                                              onChange={(e) => setEditingFrameData({ ...editingFrameData, narration: e.target.value })}
                                              className="w-full mt-1 px-2 py-1 text-sm bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[60px] text-zinc-900 dark:text-zinc-100"
                                              placeholder="输入叙事描述..."
                                            />
                                          </div>
                                          <div className="flex gap-4">
                                            <div className="flex-1">
                                              <label className="text-xs text-zinc-600 dark:text-zinc-400">时长（秒）</label>
                                              <input
                                                type="number"
                                                min="1"
                                                max="10"
                                                value={editingFrameData.duration}
                                                onChange={(e) => setEditingFrameData({ ...editingFrameData, duration: parseInt(e.target.value) || 2 })}
                                                className="w-full mt-1 px-2 py-1 text-sm bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-900 dark:text-zinc-100"
                                              />
                                            </div>
                                            <div className="flex-1">
                                              <label className="text-xs text-zinc-600 dark:text-zinc-400">转场效果</label>
                                              <select
                                                value={editingFrameData.transition}
                                                onChange={(e) => setEditingFrameData({ ...editingFrameData, transition: e.target.value || undefined })}
                                                className="w-full mt-1 px-2 py-1 text-sm bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-900 dark:text-zinc-100"
                                              >
                                                <option value="">无</option>
                                                <option value="fade">淡入淡出</option>
                                                <option value="cut">切</option>
                                                <option value="dissolve">溶解</option>
                                                <option value="wipe">擦除</option>
                                              </select>
                                            </div>
                                          </div>
                                        </div>
                                      ) : (
                                        // 显示模式
                                        <>
                                          <div className="flex items-center gap-3 text-xs text-zinc-500 mb-2">
                                            <span>{frame.duration}秒</span>
                                            {frame.transition && <span>转场: {frame.transition}</span>}
                                          </div>
                                          {generatingStoryboard ? (
                                            <div className="text-sm text-zinc-400 italic">正在生成叙事...</div>
                                          ) : frame.narration ? (
                                            <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">{frame.narration}</p>
                                          ) : (
                                            <p className="text-sm text-zinc-400 italic">暂无叙事描述</p>
                                          )}
                                        </>
                                      )}
                                    </div>
                                  </div>
                                ) : null
                              })
                            ) : (
                              // 没有 storyboard 数据，只显示照片列表
                              segment.photoIds.map((photoId, photoIndex) => {
                                // 故事tab使用智能排序后的顺序
                                const photo = (orderedPhotos.length > 0 ? orderedPhotos : photos).find(p => p.id === photoId)
                                return photo ? (
                                  <div
                                    key={photoId}
                                    className="flex gap-4 p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg"
                                  >
                                    <img
                                      src={photo.url}
                                      alt={`Photo ${photoIndex + 1}`}
                                      className="w-24 h-24 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity flex-shrink-0"
                                      onClick={() => setPreviewPhoto(photo.url)}
                                    />
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-start justify-between gap-2 mb-2">
                                        <span className="text-xs font-medium text-zinc-500">第 {photoIndex + 1} 张</span>
                                        {generatingStoryboard && (
                                          <span className="text-xs text-zinc-400">生成中...</span>
                                        )}
                                      </div>
                                      <p className="text-sm text-zinc-400 italic">
                                        {generatingStoryboard ? '正在生成叙事脚本...' : '叙事脚本生成中...'}
                                      </p>
                                    </div>
                                  </div>
                                ) : null
                              })
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </>
                  )}
                </div>
              )}

              {!storyArc && activeTab === 'story' && (
                <div className="p-12 text-center text-zinc-500">
                  <p>请先点击"生成故事"按钮</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* 图片预览弹窗 */}
      {previewPhoto && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setPreviewPhoto(null)}
        >
          <div className="relative max-w-4xl max-h-full">
            <img
              src={previewPhoto}
              alt="预览"
              className="max-w-full max-h-[85vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={() => setPreviewPhoto(null)}
              className="absolute -top-4 -right-4 w-10 h-10 bg-white dark:bg-zinc-800 rounded-full flex items-center justify-center text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700 shadow-lg"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
