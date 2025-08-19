// YouTube Video Workspace Components
// Phase 1: Educational Video Integration

export { default as YouTubeVideoMenu } from './YouTubeVideoMenu'
export { default as VideoCard } from './VideoCard'

// Re-export types for convenience
export type {
  YouTubeVideo,
  VideoSafetyAnalysis,
  YouTubeSearchRequest,
  YouTubeSearchResponse,
  VideoSelectionState,
  FreemiumLimits
} from '../../../types/youtube'