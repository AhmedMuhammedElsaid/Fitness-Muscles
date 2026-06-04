import { extractVideoId, toEmbedUrl, toWatchUrl } from '@/lib/youtube';

const ID = 'dQw4w9WgXcQ';

describe('extractVideoId', () => {
  it.each([
    ['watch', `https://www.youtube.com/watch?v=${ID}`],
    ['watch with extra params', `https://www.youtube.com/watch?list=abc&v=${ID}&t=10`],
    ['youtu.be', `https://youtu.be/${ID}`],
    ['shorts', `https://www.youtube.com/shorts/${ID}`],
    ['embed', `https://www.youtube.com/embed/${ID}?modestbranding=1`],
    ['m.youtube', `https://m.youtube.com/watch?v=${ID}`],
    ['bare id', ID],
  ])('extracts the id from a %s url', (_label, url) => {
    expect(extractVideoId(url)).toBe(ID);
  });

  it.each([['empty', ''], ['non-youtube', 'https://vimeo.com/12345'], ['garbage', 'not a url']])(
    'returns null for a %s input',
    (_label, url) => {
      expect(extractVideoId(url)).toBeNull();
    },
  );
});

describe('url builders', () => {
  it('builds an embed url with modestbranding', () => {
    expect(toEmbedUrl(ID)).toBe(`https://www.youtube.com/embed/${ID}?modestbranding=1`);
  });

  it('builds a clean watch url', () => {
    expect(toWatchUrl(ID)).toBe(`https://www.youtube.com/watch?v=${ID}`);
  });
});
