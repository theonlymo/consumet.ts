import { VideoExtractor, IVideo, ISubtitle } from '../models';
declare class VidCloud extends VideoExtractor {
    protected serverName: string;
    protected sources: IVideo[];
    extract: (videoUrl: URL, isVidcloud?: boolean) => Promise<{
        sources: IVideo[];
    } & {
        subtitles: ISubtitle[];
    }>;
}
export default VidCloud;
