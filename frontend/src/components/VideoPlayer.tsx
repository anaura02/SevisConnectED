/**
 * Video Player Component
 * Simple solution: Shows clickable link to YouTube videos
 * If embedding works, shows embed; otherwise shows link
 */
interface VideoPlayerProps {
  videoUrl?: string;
  title: string;
  description?: string;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ videoUrl, title, description }) => {

  if (!videoUrl || !videoUrl.trim()) {
    return (
      <div className="bg-gray-100 border border-gray-300 rounded-lg p-4 text-center">
        <p className="text-gray-600 text-sm">No video URL provided</p>
        <p className="text-gray-500 text-xs mt-1">Video will be available when generated</p>
      </div>
    );
  }

  // Clean the URL - remove whitespace and normalize
  const cleanUrl = videoUrl.trim();

  // Extract YouTube video ID and create proper YouTube watch URL
  const getYouTubeWatchUrl = (url: string): string | null => {
    // Handle various YouTube URL formats
    const patterns = [
      // Standard watch URLs: https://www.youtube.com/watch?v=VIDEO_ID
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
      // Short URLs: https://youtu.be/VIDEO_ID
      /youtu\.be\/([a-zA-Z0-9_-]{11})/,
      // Embed URLs: https://www.youtube.com/embed/VIDEO_ID
      /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
      // Old format: youtube.com/v/VIDEO_ID
      /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
      // Mobile format: m.youtube.com/watch?v=VIDEO_ID
      /m\.youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        // YouTube video IDs are always 11 characters
        const videoId = match[1].substring(0, 11);
        if (videoId.length === 11) {
          return `https://www.youtube.com/watch?v=${videoId}`;
        }
      }
    }
    
    // If URL looks like it might be a YouTube URL but we couldn't extract ID
    // Check if it contains a potential video ID pattern
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      // Try to extract any 11-character alphanumeric string
      const potentialId = url.match(/[a-zA-Z0-9_-]{11}/);
      if (potentialId) {
        return `https://www.youtube.com/watch?v=${potentialId[0]}`;
      }
      // If it's already a valid YouTube URL, return it as is
      if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
      }
    }
    
    return null;
  };

  // Check if URL is a YouTube URL
  const isYouTube = cleanUrl.includes('youtube.com') || cleanUrl.includes('youtu.be');
  
  // Get proper YouTube watch URL
  const youtubeWatchUrl = isYouTube ? getYouTubeWatchUrl(cleanUrl) : null;
  
  // For YouTube videos, always show a clickable link (simple solution)
  if (youtubeWatchUrl) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <h5 className="font-semibold text-gray-900 mb-2 text-lg">{title}</h5>
        {description && (
          <p className="text-sm text-gray-700 mb-4">{description}</p>
        )}
        <div className="bg-gradient-to-r from-primary-50 to-primary-100 border border-primary-200 rounded-lg p-4 mb-4">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <svg className="w-8 h-8 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 mb-1">Watch on YouTube</p>
              <p className="text-xs text-gray-600">Click the button below to watch this video on YouTube</p>
            </div>
          </div>
        </div>
        <a
          href={youtubeWatchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg transition-colors font-medium shadow-md hover:shadow-lg"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
          </svg>
          <span>Watch on YouTube</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      </div>
    );
  }

  // For Vimeo videos
  if (cleanUrl.includes('vimeo.com')) {
    const vimeoMatch = cleanUrl.match(/vimeo\.com\/(\d+)/);
    const vimeoId = vimeoMatch ? vimeoMatch[1] : null;
    const vimeoUrl = vimeoId ? `https://vimeo.com/${vimeoId}` : cleanUrl;
    
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <h5 className="font-semibold text-gray-900 mb-2 text-lg">{title}</h5>
        {description && (
          <p className="text-sm text-gray-700 mb-4">{description}</p>
        )}
        <a
          href={vimeoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg transition-colors font-medium shadow-md hover:shadow-lg"
        >
          <span>Watch on Vimeo</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      </div>
    );
  }

  // For direct video URLs (MP4, WebM, etc.) - try to play, but show link as fallback
  if (cleanUrl.match(/\.(mp4|webm|ogg|mov)(\?.*)?$/i)) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <h5 className="font-semibold text-gray-900 mb-2 text-lg">{title}</h5>
        {description && (
          <p className="text-sm text-gray-700 mb-4">{description}</p>
        )}
        <div className="mb-4">
          <video
            className="w-full rounded-lg"
            controls
            preload="metadata"
          >
            <source src={cleanUrl} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
        <a
          href={cleanUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg transition-colors font-medium shadow-md hover:shadow-lg"
        >
          <span>Download/Open Video</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      </div>
    );
  }

  // Fallback: Show link for any other URL format
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
      <h5 className="font-semibold text-gray-900 mb-2 text-lg">{title}</h5>
      {description && (
        <p className="text-sm text-gray-700 mb-4">{description}</p>
      )}
      <a
        href={cleanUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg transition-colors font-medium shadow-md hover:shadow-lg"
      >
        <span>Watch Video</span>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      </a>
    </div>
  );
};

