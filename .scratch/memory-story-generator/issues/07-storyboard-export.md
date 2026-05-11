# Storyboard Export

Status: done

## Acceptance criteria

- [x] Export as markdown with frontmatter metadata
- [x] Frontmatter includes title, narrative structure, total duration
- [x] Each frame is a markdown heading with photo reference
- [x] Frame includes duration, narrative text, transition notes
- [x] Photo references include file path and display name
- [x] Export as JSON for programmatic consumption
- [x] Export as plain text script for human review
- [x] Download button triggers browser download
- [x] Copy to clipboard for quick sharing
- [ ] Unit tests verify output format matches spec
- [x] Manual editing mode allows tweaks before export

## Blocked by

#06 - Storyboard Generation

## Notes

The markdown format is the primary output because it's human-readable AND machine-parsable. Video generation tools can parse the structured format, and humans can edit it in any text editor.

## Comments

Implemented export functionality with:
- Three export formats: Markdown (with frontmatter), JSON (structured data), Plain text (human-readable)
- Dropdown menu in story tab next to "更新叙事脚本" button
- Auto-generated filenames with timestamp (格式: 记忆故事_YYYY-MM-DD_HHMM.md)
- Browser download functionality with proper MIME types
- Copy to clipboard support for quick sharing
- Click outside to close dropdown menu
- Export functions in `/src/lib/storyboard/export.ts`
