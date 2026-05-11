import type { Storyboard } from './storyboard'

export interface ExportOptions {
  format: 'markdown' | 'json' | 'text'
  includePhotos?: boolean
}

/**
 * 导出为Markdown格式（带frontmatter）
 */
export function exportToMarkdown(storyboard: Storyboard): string {
  const { storyArc, segments, totalDuration, createdAt } = storyboard

  // Frontmatter
  let output = `---
title: "${storyArc.options.style || '记忆故事'}"
narrative_structure: ${storyArc.structure}
total_duration: ${totalDuration}s
created_at: ${createdAt.toISOString()}
segments: ${segments.length}
---

`

  // 每个segment的内容
  segments.forEach((segment, index) => {
    output += `## ${index + 1}. ${segment.title}\n\n`
    if (segment.description) {
      output += `${segment.description}\n\n`
    }

    segment.frames.forEach((frame, frameIndex) => {
      output += `### 镜头 ${index + 1}-${frameIndex + 1}\n\n`
      output += `- **照片**: ${frame.photoId}\n`
      output += `- **时长**: ${frame.duration}秒\n`
      if (frame.transition) {
        output += `- **转场**: ${frame.transition}\n`
      }
      output += `- **旁白**: ${frame.narration}\n\n`
    })
  })

  return output
}

/**
 * 导出为JSON格式
 */
export function exportToJSON(storyboard: Storyboard): string {
  const data = {
    metadata: {
      title: storyboard.storyArc.options.style || '记忆故事',
      narrative_structure: storyboard.storyArc.structure,
      total_duration: storyboard.totalDuration,
      created_at: storyboard.createdAt.toISOString(),
      segments_count: storyboard.segments.length,
    },
    segments: storyboard.segments.map(segment => ({
      id: segment.id,
      title: segment.title,
      description: segment.description,
      frames: segment.frames.map(frame => ({
        photo_id: frame.photoId,
        duration: frame.duration,
        transition: frame.transition || null,
        narration: frame.narration,
      })),
    })),
  }

  return JSON.stringify(data, null, 2)
}

/**
 * 导出为纯文本格式（用于人工审阅）
 */
export function exportToPlainText(storyboard: Storyboard): string {
  const { storyArc, segments } = storyboard

  let output = `《${storyArc.options.style || '记忆故事'}》\n`
  output += `叙事方式: ${getStructureName(storyArc.structure)}\n`
  output += `总时长: ${storyboard.totalDuration}秒\n`
  output += `创建时间: ${storyboard.createdAt.toLocaleString('zh-CN')}\n\n`
  output += `${'='.repeat(50)}\n\n`

  segments.forEach((segment, index) => {
    output += `【${index + 1}. ${segment.title}】\n\n`

    segment.frames.forEach((frame, frameIndex) => {
      output += `镜头 ${index + 1}-${frameIndex + 1}:\n`
      output += `  时长: ${frame.duration}秒`
      if (frame.transition) output += ` | 转场: ${frame.transition}`
      output += `\n`
      output += `  旁白: ${frame.narration}\n\n`
    })
  })

  return output
}

function getStructureName(structure: string): string {
  const names: Record<string, string> = {
    'chronological': '时间线',
    'emotional': '情感线',
    'thematic': '主题线'
  }
  return names[structure] || structure
}

/**
 * 触发浏览器下载
 */
export function downloadFile(content: string, filename: string, type: string = 'text/plain') {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * 复制到剪贴板
 */
export async function copyToClipboard(content: string): Promise<boolean> {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(content)
      return true
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
      return false
    }
  } else {
    // 降级方案
    const textArea = document.createElement('textarea')
    textArea.value = content
    textArea.style.position = 'fixed'
    textArea.style.left = '-999999px'
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()
    try {
      const successful = document.execCommand('copy')
      document.body.removeChild(textArea)
      return successful
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
      document.body.removeChild(textArea)
      return false
    }
  }
}

/**
 * 生成文件名
 */
export function generateFileName(format: string, timestamp?: Date): string {
  const date = timestamp || new Date()
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '')
  const timeStr = date.toTimeString().slice(0, 5).replace(':', '')

  const extensions = {
    markdown: 'md',
    json: 'json',
    text: 'txt',
  }

  return `记忆故事_${dateStr}_${timeStr}.${extensions[format as keyof typeof extensions]}`
}
