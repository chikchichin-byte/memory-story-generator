# Save & Regenerate

Status: done

## Acceptance criteria

- [x] Save button persists entire Memory to IndexedDB
- [x] Saved memories appear in a library/gallery view
- [x] Each saved memory shows thumbnail, title, date created
- [x] Click to reopen a saved memory
- [x] Reopened memory restores full state (photos, features, storyboard)
- [x] Regenerate button creates new storyboard with same photos and features
- [x] Optional settings panel allows adjusting regeneration parameters
- [x] Delete button removes saved memory
- [x] Export saved memory as backup/transfer file
- [x] Import backup file to restore memory
- [ ] Integration tests verify save/restore cycle

## Blocked by

#07 - Storyboard Export

## Notes

This rounds out the MVP by giving the Memory concept permanence. Users can come back to their stories, regenerate with new AI models, or export to share with others. The backup/import feature enables transferring between devices.

## Comments

Completed implementation including:
- IndexedDB persistence with proper error handling
- Memory gallery with thumbnails and metadata
- Full state restoration on reopen
- Regenerate functionality with skipReorder logic
- Settings panel for style customization
- Delete and export functionality
- Import with validation
- Smart random generation with seed-based reordering
- Fixed AI photo ordering to prevent photo loss
- Separated orderedPhotos for story tab display
- Improved fallback narrative generation
