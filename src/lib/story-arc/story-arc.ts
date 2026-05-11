import type { PhotoFeatures } from '@/lib/feature-space/feature-space'

export type NarrativeStructure = 'chronological' | 'emotional' | 'thematic'

export type StoryStyle = string

export interface StyleSuggestion {
  id: string
  name: string
  reason: string // 为什么推荐这个风格
}

export interface StoryOptions {
  style: StoryStyle
  seed: number // 随机种子，用于生成不同版本
}

export interface StorySegment {
  id: string
  title: string
  photoIds: string[]
  order: number
  description?: string
}

export interface StoryArc {
  structure: NarrativeStructure
  segments: StorySegment[]
  confidence: number // 0-1 score for how well this structure fits
  options: StoryOptions
}

interface StructureScore {
  structure: NarrativeStructure
  score: number
  reasoning: string
}

// 评分配置
const SCORE_WEIGHTS = {
  temporal: 0.4, // 时间跨度权重
  emotional: 0.3, // 情感变化权重
  thematic: 0.3, // 主题聚类权重
}

// 情感值映射（用于情感轨迹分析）
const EMOTION_VALUES: Record<string, number> = {
  '快乐': 0.8,
  '兴奋': 0.9,
  '爱': 0.85,
  '平静': 0.3,
  '安静': 0.2,
  '悲伤': -0.6,
  '孤独': -0.7,
  '紧张': -0.3,
  '温馨': 0.6,
  '浪漫': 0.7,
  'joy': 0.8,
  'excitement': 0.9,
  'love': 0.85,
  'calm': 0.3,
  'quiet': 0.2,
  'sadness': -0.6,
  'lonely': -0.7,
  'tense': -0.3,
  'cozy': 0.6,
  'romantic': 0.7,
}

/**
 * 分析照片特征并生成最佳故事弧
 *
 * AI会自动评估三种叙事结构（时间线/情感线/主题线），选择最适合照片内容的结构：
 * - 时间线：适合有时间跨度、有EXIF信息的照片
 * - 情感线：适合情感变化明显的照片
 * - 主题线：适合按地点/场合分组的照片
 *
 * @param features 照片特征数组
 * @param options 风格和随机种子选项
 * @returns 包含叙事结构、分段和置信度的故事弧
 */
export function generateStoryArc(features: PhotoFeatures[], options: StoryOptions = { style: '温馨', seed: Date.now() }): StoryArc {
  if (features.length === 0) {
    return {
      structure: 'chronological',
      segments: [],
      confidence: 0,
      options,
    }
  }

  // 1. AI评分：对每种叙事结构进行评分
  const scores = scoreNarrativeStructures(features)

  // 2. AI选择：加入随机性，让得分相近的结构都有机会被选择
  const random = seededRandom(options.seed)
  const randomBonus = random() * 0.15 // 0-0.15的随机加分

  // 给每个分数加上随机bonus，然后重新选择
  const adjustedScores = scores.map(s => ({
    ...s,
    adjustedScore: s.score + randomBonus * random()
  }))

  const bestScore = adjustedScores.reduce((max, s) => (s.adjustedScore > max.adjustedScore ? s : max), adjustedScores[0])

  // 3. 生成分段：使用seed影响分段的随机性（每次生成可能略有不同）
  const segments = generateSegments(features, bestScore.structure, options.seed)

  return {
    structure: bestScore.structure,
    segments,
    confidence: bestScore.score,
    options,
  }
}

/**
 * 为每种叙事结构评分
 */
function scoreNarrativeStructures(features: PhotoFeatures[]): StructureScore[] {
  const temporalScore = scoreChronological(features)
  const emotionalScore = scoreEmotional(features)
  const thematicScore = scoreThematic(features)

  return [
    {
      structure: 'chronological',
      score: temporalScore.score,
      reasoning: temporalScore.reasoning,
    },
    {
      structure: 'emotional',
      score: emotionalScore.score,
      reasoning: emotionalScore.reasoning,
    },
    {
      structure: 'thematic',
      score: thematicScore.score,
      reasoning: thematicScore.reasoning,
    },
  ]
}

/**
 * 评分时间结构
 */
function scoreChronological(features: PhotoFeatures[]): { score: number; reasoning: string } {
  const timestamps = features.map(f => f.timestamp).filter(Boolean) as Date[]

  if (timestamps.length < 2) {
    return { score: 0.2, reasoning: '时间信息不足' }
  }

  const timeSpan = getTimeSpanDays(timestamps)
  const coverage = timestamps.length / features.length

  // 时间跨度越大，时间结构越合适
  // 覆盖率越高（有EXIF的照片越多），时间结构越可靠
  let score = 0
  if (timeSpan > 7) score = 0.9
  else if (timeSpan > 3) score = 0.7
  else if (timeSpan > 1) score = 0.5
  else score = 0.3

  score = score * 0.7 + coverage * 0.3

  return {
    score,
    reasoning: `时间跨度 ${timeSpan} 天，覆盖率 ${(coverage * 100).toFixed(0)}%`,
  }
}

/**
 * 评分情感结构
 */
function scoreEmotional(features: PhotoFeatures[]): { score: number; reasoning: string } {
  const emotions = features.map(f => f.emotion).filter(Boolean)
  const moods = features.map(f => f.mood).filter(Boolean)

  if (emotions.length < features.length * 0.5) {
    return { score: 0.2, reasoning: '情感信息不足' }
  }

  // 计算情感变化幅度
  const emotionValues = emotions
    .map(e => EMOTION_VALUES[e as string] ?? 0)
    .filter(v => v !== 0)

  if (emotionValues.length < 2) {
    return { score: 0.3, reasoning: '情感变化不明显' }
  }

  const variance = calculateVariance(emotionValues)
  const range = Math.max(...emotionValues) - Math.min(...emotionValues)

  // 情感变化越大，情感结构越合适
  let score = 0
  if (range > 1.2) score = 0.9
  else if (range > 0.8) score = 0.7
  else if (range > 0.4) score = 0.5
  else score = 0.3

  return {
    score,
    reasoning: `情感变化幅度 ${range.toFixed(2)}，方差 ${variance.toFixed(2)}`,
  }
}

/**
 * 评分主题结构
 */
function scoreThematic(features: PhotoFeatures[]): { score: number; reasoning: string } {
  const locations = features.map(f => f.location).filter(Boolean)
  const contexts = features.map(f => f.context).filter(Boolean)

  // 如果地点或场合多样性高，适合主题分组
  const uniqueLocations = new Set(locations).size
  const uniqueContexts = new Set(contexts).size

  if (uniqueLocations < 2 && uniqueContexts < 2) {
    return { score: 0.2, reasoning: '主题多样性不足' }
  }

  // 计算聚类潜力：相同地点/场合的照片集中度
  const locationClusters = countClusters(features.map(f => f.location))
  const contextClusters = countClusters(features.map(f => f.context))

  const maxClusterSize = Math.max(
    ...Object.values(locationClusters),
    ...Object.values(contextClusters)
  )

  const clusterScore = maxClusterSize / features.length

  let score = 0
  if (uniqueLocations >= 3 || uniqueContexts >= 2) {
    score = 0.5 + clusterScore * 0.4
  }

  return {
    score: Math.min(score, 0.95),
    reasoning: `${uniqueLocations} 个地点，${uniqueContexts} 个场合，最大聚类 ${(clusterScore * 100).toFixed(0)}%`,
  }
}

/**
 * 根据叙事结构生成分段
 */
function generateSegments(
  features: PhotoFeatures[],
  structure: NarrativeStructure,
  seed: number = Date.now()
): StorySegment[] {
  // 使用seed创建简单的伪随机数生成器
  const random = seededRandom(seed)

  switch (structure) {
    case 'chronological':
      return generateChronologicalSegments(features, seed)
    case 'emotional':
      return generateEmotionalSegments(features, seed)
    case 'thematic':
      return generateThematicSegments(features, seed)
  }
}

// 简单的种子随机数生成器
function seededRandom(seed: number) {
  return () => {
    seed = (seed * 9301 + 49297) % 233280
    return seed / 233280
  }
}

/**
 * 时间分段：按时间段分组
 */
function generateChronologicalSegments(features: PhotoFeatures[], seed: number = Date.now()): StorySegment[] {
  // 按 timestamp 排序
  const sorted = [...features].sort((a, b) => {
    if (!a.timestamp) return 1
    if (!b.timestamp) return -1
    return a.timestamp.getTime() - b.timestamp.getTime()
  })

  // 如果没有时间信息，按上传顺序分组
  if (sorted.every(f => !f.timestamp)) {
    return groupByOrder(features, 3) // 每组3张
  }

  // 计算时间跨度
  const timestamps = sorted.map(f => f.timestamp).filter(Boolean) as Date[]
  const timeSpan = getTimeSpanDays(timestamps)

  // 根据时间跨度决定分段数量
  let segmentCount: number
  if (timeSpan > 7) segmentCount = Math.min(Math.ceil(features.length / 3), 5)
  else if (timeSpan > 3) segmentCount = Math.min(Math.ceil(features.length / 2), 4)
  else segmentCount = Math.min(features.length, 3)

  segmentCount = Math.max(segmentCount, 2)

  // 均匀分段
  const photosPerSegment = Math.ceil(sorted.length / segmentCount)
  const segments: StorySegment[] = []

  for (let i = 0; i < segmentCount; i++) {
    const start = i * photosPerSegment
    const end = Math.min(start + photosPerSegment, sorted.length)
    const segmentFeatures = sorted.slice(start, end)

    if (segmentFeatures.length === 0) break

    const firstTimestamp = segmentFeatures[0].timestamp
    const lastTimestamp = segmentFeatures[segmentFeatures.length - 1].timestamp

    segments.push({
      id: `segment-${i}`,
      title: generateTimeSegmentTitle(i, segmentCount, firstTimestamp, lastTimestamp),
      photoIds: segmentFeatures.map(f => f.photoId),
      order: i,
    })
  }

  return segments
}

/**
 * 情感分段：按情感轨迹分组
 */
function generateEmotionalSegments(features: PhotoFeatures[], seed: number = Date.now()): StorySegment[] {
  const random = seededRandom(seed)

  // 计算每张照片的情感值
  const withEmotionValues = features.map(f => ({
    feature: f,
    value: EMOTION_VALUES[f.emotion ?? ''] ?? EMOTION_VALUES[f.mood ?? ''] ?? 0,
  }))

  // 按情感值排序
  const sorted = withEmotionValues.sort((a, b) => a.value - b.value)

  // 使用seed影响分段方式：可以有2-4段
  const segmentCount = Math.floor(random() * 3) + 2 // 2-4段
  const segments: StorySegment[] = []

  // 不同的分段策略
  const strategies = [
    // 策略1: 均匀分段
    () => {
      const photosPerSegment = Math.ceil(sorted.length / segmentCount)
      for (let i = 0; i < segmentCount; i++) {
        const start = i * photosPerSegment
        const end = Math.min(start + photosPerSegment, sorted.length)
        const segmentFeatures = sorted.slice(start, end)
        if (segmentFeatures.length === 0) continue

        const titles = ['开篇', '发展', '转折', '高潮', '结尾']
        segments.push({
          id: `segment-${i}`,
          title: titles[i] || `第${i + 1}部分`,
          photoIds: segmentFeatures.map(item => item.feature.photoId),
          order: i,
          description: `情感阶段${i + 1}`,
        })
      }
    },
    // 策略2: 按情感值聚类分段
    () => {
      const clusters = [[], [], []] as Array<Array<typeof withEmotionValues[0]>>
      sorted.forEach(item => {
        if (item.value < -0.3) clusters[0].push(item)
        else if (item.value < 0.3) clusters[1].push(item)
        else clusters[2].push(item)
      })

      const titles = ['低谷', '平静', '高涨']
      clusters.forEach((cluster, i) => {
        if (cluster.length === 0) return
        segments.push({
          id: `segment-${i}`,
          title: titles[i],
          photoIds: cluster.map(item => item.feature.photoId),
          order: i,
          description: `情感${titles[i]}阶段`,
        })
      })
    }
  ]

  // 根据seed选择策略
  const strategyIndex = Math.floor(random() * strategies.length)
  strategies[strategyIndex]()

  return segments.filter(s => s.photoIds.length > 0)
}

/**
 * 主题分段：按地点/场合分组
 */
function generateThematicSegments(features: PhotoFeatures[], seed: number = Date.now()): StorySegment[] {
  const random = seededRandom(seed)

  // 优先按地点分组，如果地点不够则按场合分组
  const locationClusters = clusterByFeature(features, f => f.location)
  const contextClusters = clusterByFeature(features, f => f.context)

  // 使用seed选择分组方式
  const useLocation = Object.keys(locationClusters).length >= 2 && random() > 0.3
  const clusters = useLocation ? locationClusters : contextClusters

  const segments: StorySegment[] = []
  let order = 0

  for (const [key, photoIds] of Object.entries(clusters)) {
    if (photoIds.length === 0) continue

    segments.push({
      id: `segment-${order}`,
      title: key || '其他',
      photoIds,
      order: order++,
    })
  }

  // 使用seed决定排序方式：有的按数量，有的按标题
  if (random() > 0.5) {
    // 按照片数量排序（多的在前）
    segments.sort((a, b) => b.photoIds.length - a.photoIds.length)
  } else {
    // 按标题字母排序
    segments.sort((a, b) => a.title.localeCompare(b.title, 'zh'))
  }
  segments.forEach((s, i) => s.order = i)

  return segments
}

// 辅助函数

function getTimeSpanDays(timestamps: Date[]): number {
  if (timestamps.length < 2) return 0

  const min = Math.min(...timestamps.map(t => t.getTime()))
  const max = Math.max(...timestamps.map(t => t.getTime()))

  return Math.ceil((max - min) / (1000 * 60 * 60 * 24))
}

function calculateVariance(values: number[]): number {
  if (values.length === 0) return 0

  const mean = values.reduce((sum, v) => sum + v, 0) / values.length
  const squaredDiffs = values.map(v => Math.pow(v - mean, 2))
  return squaredDiffs.reduce((sum, d) => sum + d, 0) / values.length
}

function countClusters(values: (string | undefined)[]): Record<string, number> {
  const clusters: Record<string, number> = {}
  values.forEach(v => {
    if (v) {
      clusters[v] = (clusters[v] ?? 0) + 1
    }
  })
  return clusters
}

function clusterByFeature<T>(
  features: T[],
  getter: (item: T) => string | undefined
): Record<string, string[]> {
  const clusters: Record<string, string[]> = {}

  features.forEach(f => {
    const key = getter(f) || '其他'
    if (!clusters[key]) {
      clusters[key] = []
    }

    // 这里需要从 feature 中获取 photoId
    const feature = f as PhotoFeatures
    clusters[key].push(feature.photoId)
  })

  return clusters
}

function groupByOrder(features: PhotoFeatures[], groupSize: number): StorySegment[] {
  const segments: StorySegment[] = []

  for (let i = 0; i < features.length; i += groupSize) {
    const groupFeatures = features.slice(i, i + groupSize)

    segments.push({
      id: `segment-${segments.length}`,
      title: `第 ${segments.length + 1} 组`,
      photoIds: groupFeatures.map(f => f.photoId),
      order: segments.length,
    })
  }

  return segments
}

function generateTimeSegmentTitle(
  index: number,
  total: number,
  start?: Date,
  end?: Date
): string {
  if (!start || !end) {
    if (total <= 3) {
      return ['开始', '中间', '结尾'][index] || `第 ${index + 1} 部分`
    }
    return `第 ${index + 1} 部分`
  }

  // 格式化时间显示
  const formatDate = (date: Date) => {
    const month = date.getMonth() + 1
    const day = date.getDate()
    return `${month}月${day}日`
  }

  if (getTimeSpanDays([start, end]) < 1) {
    return formatDate(start)
  }

  if (start.toDateString() === end.toDateString()) {
    return formatDate(start)
  }

  return `${formatDate(start)} - ${formatDate(end)}`
}
