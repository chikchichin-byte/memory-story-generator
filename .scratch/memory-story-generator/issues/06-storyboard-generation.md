# Storyboard Generation

Status: done

## Acceptance criteria

- [x] 每张照片生成独立的分镜脚本描述
- [x] 分镜描述支持多种风格：温馨/文艺/幽默/纪录片/游记等
- [x] 叙事描述基于照片特征（时间、地点、人物、情感、事件等）
- [x] 分镜之间有故事推进关系，形成连贯完整的故事线
- [x] 关键时刻（高潮）的分镜获得更长时长
- [x] 自动建议转场效果（淡入淡出、切、溶解等）
- [x] 支持重新生成同一结构的不同叙事版本
- [x] 预览模式滚动显示所有分镜
- [x] 支持手动编辑叙事文本和时长
- [ ] 集成测试验证故事板结构和内容质量

## Blocked by

#05 - Story Arc Generation

## Notes

分镜脚本应该像电影脚本一样，每张照片都是一个镜头，有独立的叙事描述。例如：
- 镜头1：清晨的阳光透过窗帘洒在床头，新的一天开始了
- 镜头2：我们在酒店门口集合，大家的脸上都洋溢着期待的笑容
- 镜头3：驱车前往目的地的路上，窗外的风景如画般流转

风格示例：
- 温馨：侧重情感和回忆，文字温暖细腻
- 文艺：富有诗意和画面感，文字优美
- 幽默：轻松有趣，带点小俏皮
- 纪录片：客观描述，带点探索感
- 游记：像朋友聊天一样，自然亲切

## Comments

Implemented:
- AI-powered narrative generation for each photo frame
- Multiple style support with AI recommendations
- Feature-based narrative generation
- Story progression with coherent narrative structure
- Automatic duration assignment based on content
- Transition effect suggestions
- Regeneration capability with skipReorder logic
- Frame editing with narration, duration, and transition controls
- Preview mode for all frames
- Integration with story arc segments
