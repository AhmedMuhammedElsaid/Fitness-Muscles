import { WebView } from 'react-native-webview';

/**
 * Renders a YouTube video inside an <iframe> served from an HTML document.
 *
 * The `baseUrl` must be a normal origin, NOT `https://www.youtube.com`: using
 * youtube.com as the document origin makes the embed look like a request from
 * YouTube to itself, which its anti-abuse layer rejects with player error 152
 * ("not available in embedded players"). A neutral https origin lets the iframe
 * embed play. Verified on-device (Android 14): plain iframe + https://localhost
 * plays; youtube.com baseUrl throws 152.
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
      source={{ html, baseUrl: 'https://localhost' }}
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
