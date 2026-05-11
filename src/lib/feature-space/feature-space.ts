export interface Photo {
  id: string
  file: File
  url: string
  uploadedAt: Date
}

export interface PhotoFeatures {
  photoId: string
  timestamp?: Date

  // 场景基础信息
  location?: string
  scene_type?: string // 场景类型: 室内/室外/城市/自然/交通工具等
  setting_description?: string // 场景详细描述

  // 时间维度
  time_of_day?: string // 早晨/上午/中午/下午/黄昏/夜晚
  season?: string // 春/夏/秋/冬
  weather?: string // 晴天/阴天/雨天/雪天/雾天等

  // 人物信息
  people_count?: number // 人数
  people_descriptions?: string[] // 人物描述: 年龄/性别/外貌特征
  expressions?: string[] // 面部表情
  poses?: string[] // 人物姿态/动作
  relationships?: string[] // 人物关系: 情侣/家人/朋友/同事/陌生人

  // 情感与氛围
  emotion?: string // 主要情感
  mood?: string // 氛围感: 热闹/安静/浪漫/温馨/孤独/紧张等
  atmosphere?: string // 整体氛围描述

  // 活动与事件
  events?: string[] // 正在进行的活动
  context?: string // 活动背景/场合: 旅游/聚会/工作/日常等

  // 物体与元素
  objects?: string[] // 主要物体
  background_elements?: string[] // 背景元素
  foreground_elements?: string[] // 前景元素

  // 视觉特征
  colors?: string[] // 主色调
  lighting?: string // 光线条件: 自然光/室内光/霓虹灯/逆光等
  perspective?: string // 视角: 第一人称/第三人称/俯视/仰视/平视
  composition?: string // 构图: 人像/风景/特写/全景/合影
  camera_angle?: string // 拍摄角度

  // 风格与美学
  style?: string // 风格: 复古/现代/极简/鲜艳/黑白等
  aesthetic_keywords?: string[] // 美学关键词

  // 感官体验
  soundscape?: string // 声景描述（推测的声音）
  temperature?: string // 温度感受: 炎热/温暖/凉爽/寒冷
  textures?: string[] // 质感描述

  // 叙事元素
  story_hint?: string // 故事暗示
  moment_significance?: string // 时刻意义: 日常/庆祝/纪念/探险等
}

export interface FeatureSpaceState {
  photos: Photo[]
  features: PhotoFeatures[]
}

export type FeatureSpaceAction =
  | { type: 'addPhotos'; photos: Photo[] }
  | { type: 'setFeatures'; features: PhotoFeatures[] }
  | { type: 'updateFeature'; photoId: string; feature: Partial<PhotoFeatures> }

export interface FeatureSpaceStore {
  getState: () => FeatureSpaceState
  dispatch: (action: FeatureSpaceAction) => void
  subscribe: (listener: () => void) => () => void
}

export function createFeatureSpaceStore(): FeatureSpaceStore {
  let state: FeatureSpaceState = {
    photos: [],
    features: [],
  }
  const listeners = new Set<() => void>()

  function getState(): FeatureSpaceState {
    return state
  }

  function dispatch(action: FeatureSpaceAction): void {
    switch (action.type) {
      case 'addPhotos':
        state = { ...state, photos: [...state.photos, ...action.photos] }
        break
      case 'setFeatures':
        state = { ...state, features: action.features }
        break
      case 'updateFeature':
        state = {
          ...state,
          features: state.features.map((f) =>
            f.photoId === action.photoId ? { ...f, ...action.feature } : f
          ),
        }
        break
    }
    listeners.forEach((l) => l())
  }

  function subscribe(listener: () => void): () => void {
    listeners.add(listener)
    return () => listeners.delete(listener)
  }

  return { getState, dispatch, subscribe }
}
