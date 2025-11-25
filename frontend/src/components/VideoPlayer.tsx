/**
 * Video Player Component
 * Handles YouTube, Vimeo, and direct video URL embedding
 */
interface VideoPlayerProps {
  videoUrl?: string;
  title: string;
  description?: string;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ videoUrl, title, description }) => {

  if (!videoUrl) {
    return (
      <div className="bg-gray-100 border border-gray-300 rounded-lg p-4 text-center">
        <p className="text-gray-600 text-sm">No video URL provided</p>
        <p className="text-gray-500 text-xs mt-1">Video will be available when generated</p>
      </div>
    );
  }

  // Extract YouTube video ID from various URL formats
  const getYouTubeVideoId = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /youtube\.com\/v\/([^&\n?#]+)/,
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return match[1];
      }
    }
    return null;
  };

  // Check if URL is a YouTube URL
  const isYouTube = videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be');
  
  // Check if URL is a Vimeo URL
  const isVimeo = videoUrl.includes('vimeo.com');
  
  // Get YouTube video ID if it's a YouTube URL
  const youtubeVideoId = isYouTube ? getYouTubeVideoId(videoUrl) : null;
  
  // Get Vimeo video ID if it's a Vimeo URL
  const getVimeoVideoId = (url: string): string | null => {
    const match = url.match(/vimeo\.com\/(\d+)/);
    return match ? match[1] : null;
  };
  const vimeoVideoId = isVimeo ? getVimeoVideoId(videoUrl) : null;

  // Render YouTube embed
  if (youtubeVideoId) {
    const embedUrl = `https://www.youtube.com/embed/${youtubeVideoId}`;
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
        <div className="p-4">
          <h5 className="font-semibold text-gray-900 mb-2">{title}</h5>
          {description && (
            <p className="text-sm text-gray-700 mb-3">{description}</p>
          )}
        </div>
        <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
          <iframe
            className="absolute top-0 left-0 w-full h-full"
            src={embedUrl}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            frameBorder="0"
          ></iframe>
        </div>
      </div>
    );
  }

  // Render Vimeo embed
  if (vimeoVideoId) {
    const embedUrl = `https://player.vimeo.com/video/${vimeoVideoId}`;
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
        <div className="p-4">
          <h5 className="font-semibold text-gray-900 mb-2">{title}</h5>
          {description && (
            <p className="text-sm text-gray-700 mb-3">{description}</p>
          )}
        </div>
        <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
          <iframe
            className="absolute top-0 left-0 w-full h-full"
            src={embedUrl}
            title={title}
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
            frameBorder="0"
          ></iframe>
        </div>
      </div>
    );
  }

  // For direct video URLs (MP4, WebM, etc.)
  if (videoUrl.match(/\.(mp4|webm|ogg|mov)(\?.*)?$/i)) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
        <div className="p-4">
          <h5 className="font-semibold text-gray-900 mb-2">{title}</h5>
          {description && (
            <p className="text-sm text-gray-700 mb-3">{description}</p>
          )}
        </div>
        <video
          className="w-full"
          controls
          preload="metadata"
        >
          <source src={videoUrl} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </div>
    );
  }

  // Fallback: Show link if URL format is not recognized
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
      <h5 className="font-semibold text-gray-900 mb-2">{title}</h5>
      {description && (
        <p className="text-sm text-gray-700 mb-3">{description}</p>
      )}
      <a
        href={videoUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition-colors text-sm font-medium"
      >
        Watch Video →
      </a>
    </div>
  );
};

