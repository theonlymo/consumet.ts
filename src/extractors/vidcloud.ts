import { VideoExtractor, IVideo, ISubtitle, Intro } from '../models';

class VidCloud extends VideoExtractor {
  protected override serverName = 'VidCloud';
  protected override sources: IVideo[] = [];

  override extract = async (
    videoUrl: URL,
    isVidcloud: boolean = false
  ): Promise<{ sources: IVideo[] } & { subtitles: ISubtitle[] }> => {
    const result: { sources: IVideo[]; subtitles: ISubtitle[]; intro?: Intro } = {
      sources: [],
      subtitles: [],
    };
    try {
      const rabbit_url = process.env.RABBIT_URL
      let res = await this.client.post(
        `${rabbit_url}/api/upcloud`, { "url": videoUrl.href }
      )
      const { data } = await this.client.get(res.data.source);
      const urls = data.split('\n').filter((line: string) => line.includes('.m3u8')) as string[];
      const qualities = data.split('\n').filter((line: string) => line.includes('RESOLUTION=')) as string[];

      const TdArray = qualities.map((s, i) => {
        const f1 = s.split('x')[1];
        const f2 = urls[i];

        return [f1, f2];
      });

      for (const [f1, f2] of TdArray) {
        result.sources.push({
          url: f2,
          quality: f1,
          isM3U8: f2.includes('.m3u8'),
        });
      }

      result.sources.push({
        url: res.data.source,
        isM3U8: res.data.source.includes('.m3u8'),
        quality: 'auto',
      });

      if (res.data.subtitle) {
        result.subtitles = res.data.subtitle.map((s: any) => ({
          url: s.file,
          lang: s.label ? s.label : 'Default (maybe)',
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