import { VideoExtractor, IVideo, ISubtitle } from '../models';
declare class VidCloud extends VideoExtractor {
    protected serverName: string;
    protected sources: IVideo[];
    /**
     * Local function to fetch and decrypt VidCloud sources.
     */
    private getVidCloudSources;
    extract: (videoUrl: URL, _?: boolean, referer?: string) => Promise<{
        sources: IVideo[];
    } & {
        subtitles: ISubtitle[];
    }>;
}
export default VidCloud;
