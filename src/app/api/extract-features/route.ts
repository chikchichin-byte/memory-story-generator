import { NextRequest, NextResponse } from 'next/server'

// 服务端环境变量，不会暴露给客户端
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || ''

export async function POST(request: NextRequest) {
  try {
    const { imageData, mimeType } = await request.json()

    if (!GEMINI_API_KEY) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 })
    }

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
                inlineData: {
                  mimeType: mimeType || 'image/jpeg',
                  data: imageData,
                },
              },
              {
                text: `分析这张照片并提取全面特征。请只返回有效的中文JSON（不要markdown，不要额外文字）：

{
  "location": "地点名称，如：中国 北京 天坛",
  "scene_type": "室内/室外/城市/自然/海滩/山地/街道/家中/餐厅/公园",
  "setting_description": "3-10个字的场景描述",
  "time_of_day": "早晨/中午/下午/黄昏/夜晚",
  "season": "春天/夏天/秋天/冬天",
  "weather": "晴天/阴天/雨天/雪天",
  "people_count": 0,
  "people_descriptions": ["人物描述"],
  "expressions": ["表情"],
  "poses": ["姿态/动作"],
  "relationships": ["情侣/家人/朋友/同事/陌生人"],
  "emotion": "主要情感",
  "mood": "热闹/安静/浪漫/温馨/紧张/孤独",
  "atmosphere": "氛围描述",
  "events": ["活动"],
  "context": "旅游/聚会/工作/日常/运动",
  "objects": ["主要物品"],
  "background_elements": ["背景元素"],
  "foreground_elements": ["前景元素"],
  "colors": ["主要颜色"],
  "lighting": "自然光/室内暖光/霓虹灯/逆光/柔光",
  "perspective": "第一人称/第三人称/俯视/仰视/平视",
  "composition": "人像/风景/特写/全景/合影",
  "camera_angle": "拍摄角度",
  "style": "复古/现代/极简/鲜艳/艺术",
  "aesthetic_keywords": ["美学关键词"],
  "soundscape": "预测的声景",
  "temperature": "炎热/温暖/凉爽/寒冷",
  "textures": ["质感"],
  "story_hint": "故事暗示",
  "moment_significance": "日常/庆祝/纪念/探险"
}

重要规则：
- people_count 必须是数字（0表示无人，1-10表示人数，10以上用10）
- 如果某项信息无法确定，使用"未知"或空数组[]
- 只返回上面的JSON对象，不要markdown格式
- 使用中文值`,
              },
            ],
          },
        ],
        generationConfig: {
          maxOutputTokens: 2048,
          temperature: 0.1,
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

    // Convert Gemini response to match expected format
    const parsedText = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}'

    return NextResponse.json({
      choices: [{
        message: {
          content: parsedText,
        },
      }],
    })
  } catch (error) {
    console.error('Extract features error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
