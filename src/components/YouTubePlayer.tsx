import { WebView } from 'react-native-webview';

/**
 * Renders a YouTube video inside an <iframe> served from an HTML document with
 * `baseUrl: https://www.youtube.com`. Loading the embed URL directly via
 * `source={{ uri }}` makes the WebView a top-level navigation with no valid
 * embedding origin, which Android's player rejects ("error 153 / configuration").
 * The iframe + matching baseUrl gives the player a legitimate origin.
 */
export function YouTubePlayer({ videoId }: { videoId: string }) {
  const html = `<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" />
    <style>
      * { margin: 0; padding: 0; }
      html, body { height: 100%; background: #000; overflow: hidden; }
      .wrap { position: relative; width: 100%; height: 100%; }
      iframe { position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0; }
    </style>
  </head>
  <body>
    <div class="wrap">
      <iframe
        src="https://www.youtube.com/embed/${videoId}?playsinline=1&modestbranding=1&rel=0&fs=1"
        allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
        allowfullscreen
      ></iframe>
    </div>
  </body>
</html>`;

  return (
    <WebView
      source={{ html, baseUrl: 'https://www.youtube.com' }}
      style={{ flex: 1, backgroundColor: '#000' }}
      originWhitelist={['*']}
      javaScriptEnabled
      domStorageEnabled
      allowsInlineMediaPlayback
      mediaPlaybackRequiresUserAction={false}
      allowsFullscreenVideo
    />
  );
}
