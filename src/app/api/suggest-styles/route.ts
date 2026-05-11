import { NextRequest, NextResponse } from 'next/server'

// 服务端环境变量，不会暴露给客户端
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || ''

export async function POST(request: NextRequest) {
  try {
    const { features } = await request.json()

    if (!GEMINI_API_KEY) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 })
    }

    // 构建照片特征摘要
    const featuresSummary = features.map((f: any) => {
      const parts = []
      if (f.location) parts.push(`地点:${f.location}`)
      if (f.context) parts.push(`场合:${f.context}`)
      if (f.mood) parts.push(`氛围:${f.mood}`)
      if (f.emotion) parts.push(`情感:${f.emotion}`)
      if (f.events?.length) parts.push(`活动:${f.events.join(',')}`)
      if (f.people_count) parts.push(`人数:${f.people_count}`)
      if (f.relationships?.length) parts.push(`关系:${f.relationships.join(',')}`)
      return parts.join(' | ')
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
                text: `分析以下照片特征，推荐3-5个最适合的故事叙述风格。

照片特征:
${featuresSummary}

请以JSON格式返回推荐结果，格式如下：
{
  "suggestions": [
    {
      "id": "style_1",
      "name": "风格名称（2-4字）",
      "reason": "推荐理由（一句话说明为什么这个风格适合这些照片）"
    }
  ]
}

风格示例参考：
- 温馨家庭 - 适合家庭聚会、亲子时光
- 文艺旅行 - 适合风景照、探索发现
- 欢乐聚会 - 适合派对、庆祝活动
- 纪实记录 - 适合日常记录、成长瞬间
- 浪漫时光 - 适合情侣、婚礼
- 冒险探险 - 适合户外、运动
- 怀旧回忆 - 适合老照片、纪念时刻
- 童真童趣 - 适合儿童、玩耍

只返回JSON，不要其他内容。`,
              },
            ],
          },
        ],
        generationConfig: {
          maxOutputTokens: 1024,
          temperature: 0.7,
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
      return NextResponse.json(
        { error: `Gemini API error: ${response.status} ${response.statusText}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    const parsedText = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}'

    // 解析JSON
    let text = parsedText
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
    }

    text = text
      .replace(/,\s*}/g, '}')
      .replace(/,\s*]/g, ']')
      .replace(/\n/g, ' ')
      .trim()

    const parsed = JSON.parse(text)

    return NextResponse.json(parsed)
  } catch (error) {
    console.error('Suggest styles error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
