# Triaging UI

Status: done

## What to build

A user interface for reviewing and correcting AI-extracted features. Users can see each photo with its extracted features, edit individual fields, and manage photos before story generation.

## Acceptance criteria

- [x] Grid view showing all photos with extracted features summary
- [x] Detail view (expandable) shows full feature breakdown
- [x] All 30+ feature fields are editable
- [x] Save/Cancel buttons for edit mode
- [x] Visual indicator (orange border + warning) for unconfirmed edits
- [x] "Proceed to Story Generation" button disabled when unsaved changes exist
- [x] Delete photo functionality with confirmation
- [x] Progress indicators for first upload and append modes
- [x] Failed photo handling with retry/delete options
- [ ] Undo/redo support for feature edits
- [ ] Bulk operation: apply location correction to multiple photos
- [ ] Bulk operation: apply person label to multiple photos
- [ ] Component tests verify editing updates state correctly
- [ ] Keyboard navigation support for efficient triaging

## Implementation Summary

**Files Modified:**
- `src/app/page.tsx` - Added triaging UI with edit/delete functionality
- `src/app/api/extract-features/route.ts` - Updated API prompt to return Chinese results
- `src/components/photo-upload/photo-upload.tsx` - Updated alt text to Chinese

**Features Implemented:**
1. **Edit Mode**: Click "编辑" to enter edit mode for a photo
2. **Inline Editing**: All 30+ feature dimensions displayed as editable input fields
3. **Save/Cancel**: Commit or discard changes via buttons
4. **Unsaved Indicator**: Orange border + warning message for photos with pending changes
5. **Delete Photo**: Remove individual photos with confirmation dialog
6. **Generate Story Button**: Disabled when unsaved changes exist
7. **Photo Counter**: Shows total number of photos in header
8. **Progress Indicators**:
   - First upload: Prominent spinner with "正在分析照片... (X/Y)" message
   - Append mode: Compact inline "正在处理新照片... (X/Y)" indicator
   - Existing results remain visible during re-processing
9. **Failed Photo Handling**:
   - Shows count of failed extractions with error banner
   - Individual retry button for each failed photo
   - Bulk retry all failed photos
   - Bulk delete failed photos with confirmation
10. **Chinese Language Support**:
    - All UI text in Chinese (titles, labels, buttons, messages)
    - API prompt updated to return Chinese feature values
    - Example: "中国 北京 天坛" instead of "Temple of Heaven, Beijing, China"
11. **Visual Hierarchy**:
    - Field labels use `font-semibold text-zinc-800` for emphasis
    - Field values use `text-zinc-600` for contrast
    - Clear visual separation between labels and values

**UX Decisions:**
- Compact card view by default with key features (location, scene_type, time, people, emotion, events, objects)
- Expandable details view organized by category (Scene, People, Mood, Visual, Composition, Sensory, Narrative)
- Edit mode replaces display with input fields for all features
- Array fields (events, objects, etc.) use comma-separated input format
- Type-aware parsing (numbers, arrays, strings)

## Blocked by

#03 - Feature Extraction with AI (completed)

## Remaining Work

- Undo/redo support (could use use-undo hook or custom history)
- Bulk operations (apply to selected photos)
- Keyboard shortcuts (Enter to save, Esc to cancel, arrow keys for navigation)
- Component tests with React Testing Library
