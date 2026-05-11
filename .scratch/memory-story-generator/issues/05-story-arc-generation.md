# Story Arc Generation

Status: done

## What to build

An adaptive story arc generator that analyzes the feature space distribution and determines the optimal narrative structure (chronological, emotional, or thematic). Groups photos into chapters or segments and establishes the story's spine. Uses rule-based scoring with LLM fallback for ambiguous cases.

## Acceptance criteria

- [x] Analyzes feature space to determine temporal spread, emotional range, and thematic clusters
- [x] Scores each narrative structure type (chronological, emotional, thematic) based on feature distribution
- [x] Selects highest-scoring structure
- [x] Groups photos into segments with meaningful titles
- [x] For chronological: groups by time periods (days, phases of trip)
- [x] For emotional: groups by emotional trajectory (buildup, peak, resolution)
- [x] For thematic: groups by location, event, or person clusters
- [x] Outputs StoryArc data structure with segments and photo assignments
- [x] Integration tests verify arc logic with various feature space patterns
- [ ] Fallback to LLM for complex or ambiguous cases (deferred to storyboard generation)

## Implementation Summary

**Files Modified:**
- `src/lib/story-arc/story-arc.ts` - Story arc generation logic with three narrative structures
- `src/app/api/suggest-styles/route.ts` - AI-powered style recommendation API
- `src/app/page.tsx` - Story arc generation UI with style selection
- `src/components/photo-upload/photo-upload.tsx` - Photo preview functionality

**Features Implemented:**
1. **Adaptive Story Structures**:
   - Chronological: Groups photos by time periods
   - Emotional: Groups by emotional trajectory (buildup → peak → resolution)
   - Thematic: Groups by location, event, or person clusters

2. **AI Style Recommendations**:
   - Analyzes extracted features to suggest 3-5 appropriate narrative styles
   - Each recommendation includes reasoning
   - User can choose recommended styles or input custom style

3. **Style Options**:
   - Dropdown selection with AI-recommended styles
   - Custom style input field
   - Dynamic seed-based generation for unique results each time

4. **Photo Preview**:
   - All photos clickable for fullscreen preview
   - Modal with close options (background, ESC key, close button)

5. **Tab Navigation**:
   - Photos tab: Feature extraction results
   - Story tab: Generated story arc segments
   - Smooth state preservation when switching

## Blocked by

#04 - Triaging UI (completed)

## Remaining Work

- Fallback to LLM for complex or ambiguous cases (deferred to storyboard generation phase)
