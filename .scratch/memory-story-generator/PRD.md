# Memory Story Generator — PRD

## Problem Statement

Users have collections of photos representing meaningful life experiences — trips, celebrations, chapters of their lives — but these photos sit dormant in folders and cloud storage. There's no easy way to transform a raw photo dump into a coherent, emotionally resonant narrative that can be shared or preserved as video content.

Existing solutions are either too manual (requiring users to manually arrange photos and write captions) or too simplistic (basic slideshows with fixed transitions). Users want their memories to tell a story, not just display in sequence.

## Solution

An AI-powered system that ingests photo collections, extracts a rich feature space (time, location, people, emotion, events, objects), allows users to validate corrections through a triaging step, and then generates an adaptive story arc with a video-ready storyboard output.

The system intelligently determines the best narrative structure (chronological, emotional, or thematic) based on the content itself, pairs photos with adaptive narrative text, and produces a storyboard that can be directly consumed by video generation models (Sora, Runway, Kling).

## User Stories

1. As a memory keeper, I want to upload multiple photos at once, so that I can process an entire photo collection in one session
2. As a memory keeper, I want to see which photos were successfully uploaded and which failed, so that I can retry or exclude problematic files
3. As a memory keeper, I want to remove or reorder photos before analysis, so that I have control over the input set
4. As a memory keeper, I want the system to extract time information from photos, so that the story can be temporally anchored
5. As a memory keeper, I want the system to extract location information from photos, so that the story includes geographic context
6. As a memory keeper, I want the system to identify people in photos, so that the story can reference who was present
7. As a memory keeper, I want the system to detect emotional tone in photos, so that the narrative matches the mood
8. As a memory keeper, I want the system to recognize events and activities, so that the story describes what happened
9. As a memory keeper, I want the system to identify key objects, so that the story includes meaningful details
10. As a memory keeper, I want to review all extracted features before story generation, so that I can correct AI mistakes
11. As a memory keeper, I want to edit individual features (e.g., correct a misidentified location), so that the story is accurate
12. As a memory keeper, I want to add missing features the AI missed, so that the story is complete
13. As a memory keeper, I want the system to determine the best story structure automatically, so that I don't have to choose between chronological vs thematic
14. As a memory keeper, I want the system to group photos into chapters or segments, so that the story has structure
15. As a memory keeper, I want each photo to have narrative text that adapts to context (poetic for emotional moments, informative for events), so that the tone feels appropriate
16. As a memory keeper, I want the storyboard to show photo placement with timing information, so that I understand the video flow
17. As a memory keeper, I want to export the storyboard as a structured script, so that I can feed it to video generation models
18. As a memory keeper, I want to manually edit the storyboard before export, so that I can refine the final output
19. As a memory keeper, I want to regenerate the story with different settings, so that I can explore variations
20. As a memory keeper, I want to save my memory and associated storyboard, so that I can revisit or share it later

## Implementation Decisions

### Architecture

- **PhotoUpload Module**: Handles drag-and-drop and file picker uploads, validates file types (jpg, png, heic), stores photos temporarily using IndexedDB for client-side persistence
- **FeatureExtractor Module**: Uses vision models (Claude, GPT-4V, or specialized APIs) to extract features; processes photos in parallel with concurrency limits
- **FeatureSpace Module**: Immutable state container using a simplified store pattern; exposes selectors for reading and actions for updating
- **TriagingUI Module**: React component with editable fields for each extracted feature; expand/collapse for detailed view; individual photo deletion; unsaved changes tracking; failed photo retry and bulk delete
- **StoryArcGenerator Module**: Analyzes feature space distribution to determine optimal narrative structure; uses rule-based scoring with LLM fallback for ambiguous cases
- **StoryboardGenerator Module**: Maps story arc segments to photos using the feature space; generates narrative text via LLM with style adapters
- **StoryboardExport Module**: Outputs markdown with frontmatter for metadata; structured as frame entries with photo references, duration, text, and transition notes

### Data Contracts

**Feature Space Schema:**
```typescript
type FeatureSpace = {
  photos: Photo[]
  features: PhotoFeatures[]
  temporalRange: { start: Date; end: Date }
  locations: Location[]
  people: Person[]
  emotionalArc: EmotionalSegment[]
  events: Event[]
}

type PhotoFeatures = {
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
  mood?: string // 氛围感: 热闹/安静/浪漫/温馨/紧张/孤独等
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
```

**Storyboard Schema:**
```typescript
type Storyboard = {
  title: string
  narrativeStructure: 'chronological' | 'emotional' | 'thematic'
  segments: Segment[]
  totalDuration: number
}

type Segment = {
  id: string
  title: string
  frames: Frame[]
}

type Frame = {
  photoId: string
  duration: number
  narrativeText: string
  transition?: Transition
}
```

### AI Integration

- **Vision Model**: Gemini 2.0 Flash for feature extraction; single API call per photo with structured JSON output; processes 30+ feature dimensions for comprehensive scene understanding
- **Style Recommendation**: AI analyzes extracted features to suggest 3-5 appropriate narrative styles (e.g., 温馨家庭, 文艺旅行, 欢乐聚会) with reasoning for each recommendation
- **Style Selection**: User can choose AI-recommended styles or input custom style descriptions
- **Language**: All prompts and responses in Chinese; feature values returned in Chinese (e.g., "中国 北京 天坛" instead of "Temple of Heaven, Beijing, China")
- **Language Model**: TBD for narrative text generation; prompt includes context from feature space and desired style
- **Fallback Handling**: Mock mode for development; manual entry mode for features and narrative when AI services unavailable

### UI/UX Decisions

- **Language**: All UI text in Chinese; no mixed English/Chinese display
- **Typography**: Field labels use `font-semibold` with darker colors (`text-zinc-800`) to distinguish from field values (`text-zinc-600`)
- **Tab Navigation**: Photos and Story are displayed in separate tabs; switching is smooth and maintains state
- **Progress Indicators**:
  - Photo analysis: prominent spinner with "正在分析照片..." and progress counter (X/Y)
  - Style recommendation: "正在推荐风格..." while AI suggests appropriate narrative styles
  - Append mode: compact inline indicator that preserves existing results
- **Photo Preview**: All photos are clickable to view in fullscreen modal; close via background click, ESC key, or close button
- **Style Selection**: Dropdown with AI-recommended styles + custom input option; each style shows recommendation reason

### Performance Considerations

- Photo processing happens asynchronously with progress feedback
- Implement request queuing to avoid rate limits
- Cache extracted features in IndexedDB to avoid reprocessing
- Lazy load story arc generation until triaging is complete

## Testing Decisions

### What makes a good test

Tests verify external behavior, not implementation details. A good test for this system would verify that uploading photos produces a valid feature space, that editing a feature updates the state correctly, and that the generated storyboard has the expected structure.

### Modules to test

- **FeatureSpace Module**: Unit tests for state updates and selectors; verify immutability
- **TriagingUI Module**: Component tests using React Testing Library; verify editing features updates state
- **StoryboardGenerator Module**: Integration tests with mocked AI responses; verify story arc logic
- **StoryboardExport Module**: Unit tests for output format; verify markdown structure

### Prior art

Use Vitest for unit testing, React Testing Library for component testing. Follow AAA pattern (Arrange-Act-Assert) and descriptive test naming.

## Out of Scope

- Video generation itself (we produce the storyboard, not the final video)
- Photo editing or filters (we work with uploaded photos as-is)
- Social sharing features (save and export only)
- User authentication or multi-user support (single-user local app)
- Persistent cloud storage (IndexedDB for local persistence only)
- Real-time collaboration (single-user workflow)

## Further Notes

This PRD focuses on the MVP feature set. Future enhancements could include:
- Music recommendation based on emotional arc
- Voiceover narration generation
- Multiple storyboard templates and styles
- Import from cloud services (Google Photos, iCloud)
- Memory timeline across multiple collections

The triaging step is critical — it addresses the main pain point of AI inaccuracy in photo analysis while giving users a sense of control over their memories. The adaptive narrative structure differentiates this from slideshow tools that force a fixed chronology.
