# Feature Extraction with AI

Status: done

## What to build

Integration with vision AI models to extract features from uploaded photos. Processes photos in parallel with concurrency limits, extracting comprehensive features across 30+ dimensions. Results populate the FeatureSpace.

## Acceptance criteria

- [x] EXIF data extraction for timestamp and GPS coordinates
- [x] Vision API integration (Gemini 2.0 Flash) for comprehensive feature extraction
- [x] Face/people detection via Vision AI (count + descriptions)
- [x] Parallel processing with configurable concurrency limit (default: 3)
- [x] Progress indicator shows extraction status per photo
- [x] Extracted features populate FeatureSpace via store actions
- [x] Failed extractions are logged and don't block other photos
- [ ] Retry mechanism for individual failed extractions
- [x] Integration tests verify feature extraction with mocked AI responses
- [x] Mock fallback mode when AI is unavailable or for development

## Implementation Summary

**Files:**
- `src/lib/feature-extraction/feature-extraction.ts` - EXIF + Vision extraction logic
- `src/app/api/extract-features/route.ts` - Server-side Gemini API proxy
- `.env.local` - API key configuration (NEXT_PUBLIC_GEMINI_API_KEY)

**API Integration:**
- **Primary**: Gemini 2.0 Flash via generativelanguage.googleapis.com
- **EXIF Library**: exif-js for timestamp and GPS data
- **Mock Mode**: `NEXT_PUBLIC_USE_MOCK_AI=true` for development/testing

**Processing Flow:**
1. Photos uploaded in batches
2. EXIF data extracted client-side
3. Base64 encoding for Vision API
4. Parallel API calls with concurrency limit
5. JSON response parsed and merged into PhotoFeatures
6. Progress callbacks update UI

**Error Handling:**
- API errors log detailed info but fall back to mock data
- Individual photo failures don't block the batch
- Console errors for debugging

## Blocked by

#02 - FeatureSpace Data Model (completed)

## Dependencies

None - ready for #04 Triaging UI

## Remaining Work

- Retry mechanism for individual failed extractions
- Manual entry mode for offline usage
- Cached results to avoid re-processing same photos
