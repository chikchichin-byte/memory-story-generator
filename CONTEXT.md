# Memory Story Generator

An AI-powered system that transforms photo collections into structured, video-ready storyboards.

## Language

**Memory**:
A collection of photos uploaded by a user representing a coherent life experience (trip, celebration, period).
_Avoid_: Photo album, gallery, dump

**Feature Space**:
The multi-dimensional representation extracted from photos including time, location, people, emotion, events, and objects.
_Avoid_: Photo data, metadata, analysis results

**Story Arc**:
The AI-determined narrative structure that organizes memories into a coherent sequence (chronological, emotional, or thematic).
_Avoid_: Timeline, sequence, slideshow

**Storyboard**:
The final output format pairing photos with narrative text, timing, and transition notes for video generation.
_Avoid_: Video, script, output

**Triaging**:
The intermediate step where users review and correct AI-extracted features before story generation.
_Avoid_: Editing, review, confirmation

## Relationships

- A **Memory** contains multiple photos
- Photos are analyzed to build a **Feature Space**
- User reviews **Feature Space** during **Triaging**
- **Story Arc** is generated from validated **Feature Space**
- **Storyboard** pairs photos with narrative text based on **Story Arc**

## Example dialogue

> **Dev:** "After user uploads photos, do we generate the storyboard immediately?"
> **Domain expert:** "No — we first extract the feature space and let the user triage it. Only after they confirm the features do we generate the story arc and storyboard."

## Flagged ambiguities

- "story" was used ambiguously to mean both the narrative structure and the final output — resolved: **Story Arc** is the structure, **Storyboard** is the output.
- "analysis" conflated extraction and presentation — resolved: **Feature Space** is the data, **Triaging** is the user interaction.
