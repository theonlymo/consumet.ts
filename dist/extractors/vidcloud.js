"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const models_1 = require("../models");
class VidCloud extends models_1.VideoExtractor {
    constructor() {
        super(...arguments);
        this.serverName = 'VidCloud';
        this.sources = [];
        this.extract = async (videoUrl, isVidcloud = false) => {
            var _a;
            const result = {
                sources: [],
                subtitles: [],
            };
            try {
                const id = (_a = videoUrl.href.split('/').pop()) === null || _a === void 0 ? void 0 : _a.split('?')[0];
                const rabbit_url = process.env.RABBIT_URL;
                let res = await this.client.post(`${rabbit_url}/${isVidcloud ? "vidcloud" : "upcloud"}`, { "id": id });
                const { data } = await this.client.get(res.data.source);
                const urls = data.split('\n').filter((line) => line.includes('.m3u8'));
                const qualities = data.split('\n').filter((line) => line.includes('RESOLUTION='));
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
                result.subtitles = res.data.subtitle.map((s) => ({
                    url: s.file,
                    lang: s.label ? s.label : 'Default (maybe)',
                }));
                return result;
            }
            catch (err) {
                throw err;
            }
        };
    }
}
exports.default = VidCloud;
//# sourceMappingURL=vidcloud.js.map