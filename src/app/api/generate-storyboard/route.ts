import { NextRequest, NextResponse } from 'next/server'

// 服务端环境变量，不会暴露给客户端
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || ''

export async function POST(request: NextRequest) {
  try {
    const { photos, features, segments, style, seed } = await request.json()

    if (!GEMINI_API_KEY) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 })
    }

    // 为每个 segment 生成叙事脚本
    const segmentResults = await Promise.all(
      segments.map(async (segment: any) => {
        const segmentPhotos = segment.photoIds.map((id: string) => {
          const photo = photos.find((p: any) => p.id === id)
          const feature = features.find((f: any) => f.photoId === id)
          return { photo, feature }
        }).filter((pf: any): pf is { photo: any; feature: any } => {
          // 过滤掉找不到photo或feature的项
          const valid = pf.photo && pf.feature
          if (!valid) {
            console.warn('Missing photo or feature for id:', segment.photoIds.find((id: string) =>
              !photos.find((p: any) => p.id === id) || !features.find((f: any) => f.photoId === id)
            ))
          }
          return valid
        })

        // 如果segment没有有效的照片，跳过
        if (segmentPhotos.length === 0) {
          console.warn('Segment has no valid photos:', segment.id)
          return {
            segmentId: segment.id,
            narratives: [],
          }
        }

        const segmentNarratives = await generateSegmentNarratives(
          segmentPhotos,
          segment.title,
          style,
          seed
        )

        return {
          segmentId: segment.id,
          narratives: segmentNarratives,
        }
      })
    )

    // 构建完整的 storyboard
    const storyboardId = `storyboard-${seed}`

    let totalOrder = 0
    const storyboardSegments: any[] = []

    for (const result of segmentResults) {
      const frames = result.narratives.map((narr: any) => ({
        id: `frame-${storyboardId}-${totalOrder++}`,
        photoId: narr.photoId,
        segmentId: result.segmentId,
        order: narr.order,
        narration: narr.narration,
        duration: narr.duration,
        transition: narr.transition,
      }))

      storyboardSegments.push({
        id: result.segmentId,
        title: segments.find((s: any) => s.id === result.segmentId)?.title || '',
        frames,
      })
    }

    const storyboard = {
      id: storyboardId,
      segments: storyboardSegments,
      totalDuration: storyboardSegments.reduce(
        (sum: number, seg: any) =>
          sum + seg.frames.reduce((s: number, f: any) => s + f.duration, 0),
        0
      ),
    }

    return NextResponse.json(storyboard)
  } catch (error) {
    console.error('Generate storyboard error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function generateSegmentNarratives(
  photoFeatures: { photo: any; feature: any }[],
  segmentTitle: string,
  style: string,
  seed: number
): Promise<
  {
    photoId: string
    order: number
    narration: string
    duration: number
    transition: string
  }[]
> {
  // 构建照片特征摘要
  const photosSummary = photoFeatures.map((pf, index) => {
    const f = pf.feature
    const parts = []
    if (f.location) parts.push(`地点:${f.location}`)
    if (f.context) parts.push(`场合:${f.context}`)
    if (f.mood) parts.push(`氛围:${f.mood}`)
    if (f.emotion) parts.push(`情感:${f.emotion}`)
    if (f.events?.length) parts.push(`活动:${f.events.join(',')}`)
    if (f.people_count) parts.push(`人数:${f.people_count}`)
    if (f.weather) parts.push(`天气:${f.weather}`)
    if (f.time_of_day) parts.push(`时间:${f.time_of_day}`)
    return `照片${index + 1}:${parts.join('，')} (${f.setting_description || ''})`
  }).join('\n')

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: `你是一位专业的故事脚本作家。请为以下章节中的每张照片生成分镜叙事脚本。

章节名称：${segmentTitle}

故事风格：${style}

照片信息（按顺序）：
${photosSummary}

重要规则：
1. 只使用上述照片信息中提供的特征，绝对不要编造、臆测或添加任何未提及的内容
2. 如果某项特征信息缺失（如没有地点、没有活动等），就跳过该特征，不要猜测
3. 叙事描述应简洁准确，直接描述照片中可见的元素
4. 每张照片的时长：有人物活动或重要场景的照片3-4秒，普通风景或静态照片2-3秒
5. 转场效果：场景变化用 fade，时间连续用 cut，氛围相似用 dissolve，动作切换用 wipe

返回JSON格式，必须严格按照以下格式：
{
  "narratives": [
    {
      "photoId": "照片1",
      "order": 0,
      "narration": "简洁描述照片内容，只使用提供的特征信息",
      "duration": 3,
      "transition": "cut"
    }
  ]
}

注意：
- photoId 必须使用"照片1"、"照片2"这样的格式，对应输入中的照片顺序
- order 必须是数字，从0开始按顺序递增
- duration 必须是数字，范围2-4
- 只返回JSON，不要有其他内容`,
            },
          ],
        },
      ],
      generationConfig: {
        maxOutputTokens: 2048,
        temperature: 0.7 + ((seed % 1000) / 1000) * 0.5, // 0.7-1.2之间，更大的随机性
        topK: 40,
        topP: 0.95,
      },
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('Gemini API error:', {
      status: response.status,
      statusText: response.statusText,
      body: errorText,
    })
    throw new Error(`Gemini API error: ${response.status}`)
  }

  const data = await response.json()
  let text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''

  if (!text) {
    throw new Error('Empty response from API')
  }

  // 解析 JSON
  text = text
    .replace(/```json\s*/g, '')
    .replace(/```\s*/g, '')
    .trim()

  const firstBrace = text.indexOf('{')
  if (firstBrace !== -1) {
    let depth = 0
    for (let i = firstBrace; i < text.length; i++) {
      if (text[i] === '{') depth++
      else if (text[i] === '}') depth--

      if (depth === 0) {
        text = text.substring(firstBrace, i + 1)
        break
      }
    }

    if (depth > 0) {
      text = text.substring(firstBrace)
    }
  }

  text = text
    .replace(/,\s*}/g, '}')
    .replace(/,\s*]/g, ']')
    .trim()

  try {
    const parsed = JSON.parse(text)
    const narratives = parsed.narratives || []

    // 将 AI 返回的"照片1"、"照片2"映射回实际的 photoId
    return narratives.map((n: any, index: number) => ({
      ...n,
      photoId: photoFeatures[index]?.photo?.id || n.photoId,
      order: index,
    }))
  } catch (error) {
    console.error('JSON parse error:', error)
    console.error('Failed text:', text)

    // 降级：返回简单的叙事，而不是特征提取内容
    return photoFeatures.map((pf, index) => {
      const f = pf.feature
      // 尝试构建简单的叙事，而不是直接显示特征
      const parts = []
      if (f.location) parts.push(f.location)
      if (f.time_of_day) parts.push(f.time_of_day)
      if (f.weather) parts.push(f.weather)

      const sceneDesc = parts.length > 0 ? parts.join('，') : '这个瞬间'
      const narration = `记录下${sceneDesc}的美好时刻`

      return {
        photoId: pf.photo?.id || `photo-${index}`,
        order: index,
        narration,
        duration: 2,
        transition: index < photoFeatures.length - 1 ? 'cut' : '',
      }
    })
  }
}
