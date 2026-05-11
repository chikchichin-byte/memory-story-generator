# FeatureSpace Data Model

Status: done

## What to build

The immutable data model and state management for the feature space — the central data structure that holds photos and their extracted features. This module provides a simplified store pattern with actions for updates and selectors for reading, ensuring immutability and predictability.

## Acceptance criteria

- [x] FeatureSpace type definition with all required fields
- [x] PhotoFeatures type linking photos to extracted data (30+ dimensions)
- [x] Immutable store with actions: addPhotos, setFeatures, updateFeature
- [x] Selectors for reading: getState, dispatch, subscribe
- [ ] State persists to IndexedDB automatically on changes
- [ ] Store hydrates from IndexedDB on initialization
- [x] Immutability is enforced (no direct mutations)
- [x] Unit tests verify state updates and selectors

## Implementation Summary

**Files Created/Modified:**
- `src/lib/feature-space/feature-space.ts` - Core store and type definitions
- `src/lib/feature-extraction/feature-extraction.ts` - EXIF + Vision AI extraction
- `src/lib/feature-extraction/feature-extraction.test.ts` - Unit tests
- `src/app/api/extract-features/route.ts` - Next.js API route for Gemini Vision
- `src/app/page.tsx` - Photo upload + feature display UI

**Key Design Decisions:**
1. **Extended Feature Space**: Expanded from 6 basic dimensions to 30+ dimensions for comprehensive scene understanding
2. **Vision API Integration**: Using Gemini 2.0 Flash with mock fallback for development
3. **Parallel Processing**: Photos processed in configurable batches (default: 3 concurrent)
4. **Progress Callbacks**: Real-time feedback during extraction
5. **Immutability**: All state updates create new objects, no mutations

**Feature Dimensions (30+):**
- Scene: location, scene_type, setting_description
- Time: time_of_day, season, weather
- People: people_count, people_descriptions, expressions, poses, relationships
- Emotion: emotion, mood, atmosphere
- Activities: events, context
- Objects: objects, background_elements, foreground_elements
- Visual: colors, lighting, perspective, composition, camera_angle
- Style: style, aesthetic_keywords
- Sensory: soundscape, temperature, textures
- Narrative: story_hint, moment_significance

## Blocked by

None

## Dependencies

Issue #03 (Feature Extraction) was implemented alongside this module.
Issue #04 (Triaging UI) can now proceed with editing capabilities.

## Remaining Work

- IndexedDB persistence for offline support
- IndexedDB hydration on app initialization
- Additional selectors for derived data (temporalRange, getLocations, etc.)
