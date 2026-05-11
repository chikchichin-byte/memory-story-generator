import { NextRequest, NextResponse } from 'next/server'

// 服务端环境变量，不会暴露给客户端
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || ''

export async function POST(request: NextRequest) {
  try {
    const { photos, features, style, seed = Date.now() } = await request.json()

    if (!GEMINI_API_KEY) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 })
    }

    // 构建照片摘要用于分析
    const photosSummary = features.map((f: any, index: number) => {
      const parts = []
      if (f.location) parts.push(`地点:${f.location}`)
      if (f.time_of_day) parts.push(`时间:${f.time_of_day}`)
      if (f.weather) parts.push(`天气:${f.weather}`)
      if (f.people_count !== undefined) parts.push(`人数:${f.people_count}`)
      if (f.emotion) parts.push(`情感:${f.emotion}`)
      if (f.events?.length) parts.push(`活动:${f.events.join(',')}`)
      if (f.context) parts.push(`场合:${f.context}`)
      if (f.timestamp) parts.push(`拍摄时间:${new Date(f.timestamp).toLocaleString()}`)
      return `照片${index + 1}(ID:${f.photoId}): ${parts.join('，')} - ${f.setting_description || ''}`
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
                text: `你是一位专业的故事编辑。请根据以下照片的特征，分析并推荐最佳的播放顺序，以讲述一个连贯的${style}故事。

照片信息（按当前上传顺序）：
${photosSummary}

请分析：
1. 照片的时间顺序（如果有拍摄时间）
2. 地点转移的逻辑性
3. 情感发展曲线
4. 故事的起承转合

返回JSON格式，必须严格按照以下格式：
{
  "recommendedOrder": [
    {
      "photoId": "照片ID",
      "currentPosition": 当前位置数字（从1开始）,
      "recommendedPosition": 推荐位置数字（从1开始）,
      "reason": "排序理由（简短说明为什么这个位置合适）"
    }
  ],
  "reasoning": "整体排序思路的简要说明"
}

注意：
- photoId 必须使用输入中提供的实际 photoId
- recommendedPosition 必须是1到${photos.length}之间的唯一数字，不能重复
- 只返回JSON，不要有其他内容`,
              },
            ],
          },
        ],
        generationConfig: {
          maxOutputTokens: 2048,
          temperature: 0.6 + ((seed % 1000) / 1000) * 0.4, // 0.6-1.0之间
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

      // 获取所有原始照片ID
      const originalPhotoIds = photos.map((p: any) => p.id)
      const photoIdSet = new Set(originalPhotoIds)

      // 构建新顺序：使用AI返回的顺序，但确保不丢失照片
      const reorderedPhotoIds: string[] = []
      const seenPhotoIds = new Set<string>()

      // 先添加AI推荐的顺序
      if (parsed.recommendedOrder && Array.isArray(parsed.recommendedOrder)) {
        for (const item of parsed.recommendedOrder) {
          if (item.photoId && photoIdSet.has(item.photoId) && !seenPhotoIds.has(item.photoId)) {
            reorderedPhotoIds.push(item.photoId)
            seenPhotoIds.add(item.photoId)
          }
        }
      }

      // 补充AI可能遗漏的照片（按原始顺序追加到后面）
      for (const photoId of originalPhotoIds) {
        if (!seenPhotoIds.has(photoId)) {
          reorderedPhotoIds.push(photoId)
          seenPhotoIds.add(photoId)
        }
      }

      // 验证最终数量
      if (reorderedPhotoIds.length !== originalPhotoIds.length) {
        console.error('Photo count mismatch:', {
          originalCount: originalPhotoIds.length,
          reorderedCount: reorderedPhotoIds.length,
          originalIds: originalPhotoIds,
          reorderedIds: reorderedPhotoIds,
        })
        // 降级：返回原始顺序
        return NextResponse.json({
          reorderedPhotoIds: originalPhotoIds,
          reasoning: '保持原始顺序（排序异常）',
        })
      }

      return NextResponse.json({
        reorderedPhotoIds,
        reasoning: parsed.reasoning || 'AI 已重新排序以优化故事线',
      })
    } catch (error) {
      console.error('JSON parse error:', error)

      // 降级：返回原始顺序
      return NextResponse.json({
        reorderedPhotoIds: photos.map((p: any) => p.id),
        reasoning: '保持原始顺序（解析失败）',
      })
    }
  } catch (error) {
    console.error('Reorder photos error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
