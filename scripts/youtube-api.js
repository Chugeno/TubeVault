class YouTubeAPI {
    constructor(apiKey, channelId) {
        this.apiKey = apiKey;
        this.channelId = channelId;
        this.videoCache = new Map();
    }

    async getVideoMetadata(videoId) {
        if (this.videoCache.has(videoId)) {
            return this.videoCache.get(videoId);
        }

        const response = await fetch(
            `https://www.googleapis.com/youtube/v3/videos?` +
            `id=${videoId}&key=${this.apiKey}&part=snippet,contentDetails`
        );
        const data = await response.json();
        
        if (!data.items?.[0]) return null;

        const videoData = this.parseVideoDescription(data.items[0]);
        this.videoCache.set(videoId, videoData);
        return videoData;
    }

    parseVideoDescription(videoItem) {
        const description = videoItem.snippet.description;
        const metadata = {};
        
        const metadataRegex = /\[(.*?):\s*(.*?)\]/g;
        let match;
        
        while ((match = metadataRegex.exec(description)) !== null) {
            const [_, key, value] = match;
            const normalizedKey = key.toLowerCase();
            
            switch(normalizedKey) {
                case 'type':
                    metadata.type = value.toLowerCase();
                    break;
                case 'director':
                    metadata.director = value;
                    break;
                case 'actors':
                    metadata.actors = value.split(',').map(a => a.trim());
                    break;
                case 'series':
                    metadata.series = value;
                    break;
                case 'season':
                    metadata.season = parseInt(value);
                    break;
                case 'episode':
                    metadata.episode = parseInt(value);
                    break;
                case 'synopsis':
                    metadata.synopsis = value;
                    break;
            }
        }

        return {
            id: videoItem.id,
            title: videoItem.snippet.title,
            thumbnail: videoItem.snippet.thumbnails.high.url,
            type: metadata.type || 'movie',
            director: metadata.director,
            actors: metadata.actors || [],
            season: metadata.season,
            episode: metadata.episode,
            series: metadata.series,
            synopsis: metadata.synopsis
        };
    }
} 