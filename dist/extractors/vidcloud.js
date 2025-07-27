"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const models_1 = require("../models");
const utils_1 = require("../utils");
const crypto_js_1 = __importDefault(require("crypto-js"));
class VidCloud extends models_1.VideoExtractor {
    constructor() {
        super(...arguments);
        this.serverName = 'VidCloud';
        this.sources = [];
        this.extract = async (videoUrl, _, referer = 'https://flixhq.to/') => {
            const result = {
                sources: [],
                subtitles: [],
            };
            try {
                const options = {
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest',
                        Referer: videoUrl.href,
                        'User-Agent': utils_1.USER_AGENT,
                    },
                };
                const { data: html } = await this.client.get(videoUrl.href, {
                    headers: {
                        'User-Agent': utils_1.USER_AGENT,
                        Referer: referer,
                        Connection: 'keep-alive',
                        'sec-ch-ua': '"Not)A;Brand";v="8", "Chromium";v="138", "Google Chrome";v="138"',
                        'sec-ch-ua-mobile': '?0',
                        'sec-ch-ua-platform': '"macOS"',
                        DNT: '1',
                        'Upgrade-Insecure-Requests': '1',
                        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
                        'Sec-Fetch-Site': 'cross-site',
                        'Sec-Fetch-Mode': 'navigate',
                        'Sec-Fetch-User': '?1',
                        'Sec-Fetch-Dest': 'iframe',
                        'Sec-Fetch-Storage-Access': 'none',
                        'Accept-Language': 'en-US,en;q=0.9,ar;q=0.8',
                        Pragma: 'no-cache',
                        'Cache-Control': 'no-cache',
                    },
                });
                // Try to extract the key from the <div data-dpi="..."> if present
                let k = null;
                const divMatch = html.match(/<div[^>]+data-dpi="([^"]+)"[^>]*>/);
                if (divMatch) {
                    k = divMatch[1];
                }
                else {
                    // Try to extract nonce from <script nonce="...">
                    const nonceMatch = html.match(/<script[^>]+nonce="([^"]+)"[^>]*>/);
                    if (nonceMatch) {
                        k = nonceMatch[1];
                    }
                    else {
                        // Fallback: Extract x, y, z from the script tag
                        const match = html.match(/window\._lk_db\s*=\s*{x:\s*"([^"]+)",\s*y:\s*"([^"]+)",\s*z:\s*"([^"]+)"}/);
                        if (!match) {
                            throw new Error('Could not extract _lk_db values, data-dpi, or nonce from page');
                        }
                        k = match[1] + match[2] + match[3];
                    }
                }
                // Extract id from the videoUrl (assuming id is the last path segment or as a query param)
                const urlObj = new URL(videoUrl.href);
                const id = urlObj.searchParams.get('id') || urlObj.pathname.split('/').pop();
                // Build the new source URL
                const sourceUrl = `https://streameeeeee.site/embed-1/v2/e-1/getSources?id=${id}&z=`;
                // Use the local getVidCloudSources instead of getSources
                const res = await this.getVidCloudSources(sourceUrl, referer);
                const sources = res.sources;
                this.sources = sources.map((s) => ({
                    url: s.file,
                    isM3U8: s.file.includes('.m3u8') || s.file.endsWith('m3u8'),
                }));
                result.sources.push(...this.sources);
                result.sources = [];
                this.sources = [];
                for (const source of sources) {
                    const { data } = await this.client.get(source.file, options);
                    const urls = data
                        .split('\n')
                        .filter((line) => line.includes('.m3u8') || line.endsWith('m3u8'));
                    const qualities = data.split('\n').filter((line) => line.includes('RESOLUTION='));
                    const TdArray = qualities.map((s, i) => {
                        const f1 = s.split('x')[1];
                        const f2 = urls[i];
                        return [f1, f2];
                    });
                    for (const [f1, f2] of TdArray) {
                        this.sources.push({
                            url: f2,
                            quality: f1,
                            isM3U8: f2.includes('.m3u8') || f2.endsWith('m3u8'),
                        });
                    }
                    result.sources.push(...this.sources);
                }
                result.sources.push({
                    url: sources[0].file,
                    isM3U8: sources[0].file.includes('.m3u8') || sources[0].file.endsWith('m3u8'),
                    quality: 'auto',
                });
                result.subtitles = res.tracks.map((s) => ({
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
    /**
     * Local function to fetch and decrypt VidCloud sources.
     */
    async getVidCloudSources(sourceUrl, referer) {
        const keyUrl = 'https://key.hi-anime.site/';
        try {
            const [sourceResponseRaw, keyResponse] = await Promise.all([
                this.client.get(sourceUrl, {
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest',
                        Referer: referer,
                        'User-Agent': utils_1.USER_AGENT,
                    },
                }),
                this.client.get(keyUrl, {
                    headers: {
                        'User-Agent': utils_1.USER_AGENT,
                    },
                }),
            ]);
            const sourceResponse = sourceResponseRaw.data;
            const encrypted = sourceResponse.sources;
            const key = keyResponse.data.key;
            // Debug logging
            console.log('[VidCloud] typeof encrypted:', typeof encrypted, 'value:', encrypted);
            console.log('[VidCloud] typeof key:', typeof key, 'value:', key);
            if (!encrypted || typeof encrypted !== 'string') {
                throw new Error('Encrypted sources is not a string or is undefined.');
            }
            if (!key || typeof key !== 'string') {
                throw new Error('Key is not a string or is undefined.');
            }
            const decryptedBytes = crypto_js_1.default.AES.decrypt(encrypted, key);
            const decryptedText = decryptedBytes.toString(crypto_js_1.default.enc.Utf8);
            if (!decryptedText) {
                throw new Error('Decryption failed or returned empty');
            }
            const response = JSON.parse(decryptedText);
            return {
                sources: response,
                tracks: sourceResponse.tracks,
                intro: sourceResponse.intro,
                outro: sourceResponse.outro,
            };
        }
        catch (error) {
            console.error('[VidCloud] getVidCloudSources error:', error);
            throw new Error(`Error getting episode sources: ${error.message}`);
        }
    }
}
exports.default = VidCloud;
//# sourceMappingURL=vidcloud.js.map