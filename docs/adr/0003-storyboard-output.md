# Storyboard as video-ready script output

The system outputs storyboards as frame-by-frame scripts with photo references, narrative text, timing, and transition notes. We chose this over raw JSON or video files because (1) it serves as a human-readable preview, (2) it's directly usable by video generation models (Sora, Runway, Kling), and (3) it allows manual editing before video generation. JSON would require a rendering tool; video would lose editability.
