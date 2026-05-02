import { VideoExtractor, IVideo, ISubtitle, Intro } from '../models';

class VidCloud extends VideoExtractor {
  protected override serverName = 'VidCloud';
  protected override sources: IVideo[] = [];

  override extract = async (
    videoUrl: URL,
    _?: boolean,
    referer: string = 'https://flixhqz.com/'
  ): Promise<{ sources: IVideo[] } & { subtitles: ISubtitle[] }> => {
    const result: { sources: IVideo[]; subtitles: ISubtitle[]; intro?: Intro } = {
      sources: [],
      subtitles: [],
    };
    try {
      const rabbit_url = process.env.RABBIT_URL;
      // Use the original embed URL path, but set custom headers
      const headers = {
        referer: 'https://streameeeeee.site/',
        origin: 'https://streameeeeee.site',
      };
      let res = await this.client.get(`${rabbit_url}/embed?embed_url=${videoUrl.href}&referrer=${referer}`);
      // Parse m3u8_links from the new response format
      if (Array.isArray(res.data.m3u8_links)) {
        for (const link of res.data.m3u8_links) {
          result.sources.push({
            url: link.file,
            quality: link.type === 'hls' ? 'auto' : link.label || 'auto',
            isM3U8: link.file.includes('.m3u8'),
          });
        }
      }
      // Parse subtitles from the new response format
      if (Array.isArray(res.data.subtitles)) {
        result.subtitles = res.data.subtitles.map((s: any) => ({
          url: s.file,
          lang: s.label || 'Unknown',
        }));
      } else {
        result.subtitles = [];
      }
      return result;
    } catch (err) {
      throw err;
    }
  };
}

export default VidCloud;
