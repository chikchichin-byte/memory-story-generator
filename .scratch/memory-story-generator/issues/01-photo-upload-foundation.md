# Photo Upload Foundation

Status: ready-for-agent

## What to build

A complete photo upload flow that allows users to select multiple photos via drag-and-drop or file picker, preview uploaded photos, remove or reorder them, and persist them locally using IndexedDB. This is the entry point for the entire Memory Story Generator workflow.

## Acceptance criteria

- [ ] User can drag and drop multiple photos onto the upload area
- [ ] User can click to open file picker and select multiple photos
- [ ] Only valid image types are accepted (jpg, png, heic)
- [ ] Uploaded photos are displayed as thumbnails in a grid
- [ ] User can remove individual photos from the upload
- [ ] User can reorder photos via drag and drop
- [ ] Photos are persisted to IndexedDB so they survive page refresh
- [ ] Upload errors are displayed (invalid file type, file too large, etc.)
- [ ] Progress indicator shows during file processing
- [ ] User can proceed to feature extraction when at least one photo is uploaded

## Blocked by

None - can start immediately
