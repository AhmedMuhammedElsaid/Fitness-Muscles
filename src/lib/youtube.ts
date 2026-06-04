const BARE_ID = /^[\w-]{11}$/;

const URL_PATTERNS = [
  /youtu\.be\/([\w-]{11})/,
  /youtube\.com\/(?:watch\?(?:[^#]*&)?v=|embed\/|shorts\/|live\/|v\/)([\w-]{11})/,
];

export function extractVideoId(url: string): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (BARE_ID.test(trimmed)) return trimmed;
  for (const pattern of URL_PATTERNS) {
    const match = trimmed.match(pattern);
    if (match) return match[1];
  }
  return null;
}

export function toEmbedUrl(id: string): string {
  return `https://www.youtube.com/embed/${id}?modestbranding=1`;
}

export function toWatchUrl(id: string): string {
  return `https://www.youtube.com/watch?v=${id}`;
}
