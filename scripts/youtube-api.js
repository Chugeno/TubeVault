class YouTubeAPI {
    constructor(apiKey, channelId) {
        this.apiKey = CONFIG.youtubeApiKey;
        this.clientId = CONFIG.oauthClientId;
        this.channelId = channelId;
        this.videoCache = new Map();
        this.accessToken = null;
        this.dailyQuota = {
            used: 0,
            limit: 10000,
            lastReset: new Date().setHours(0,0,0,0)
        };
        this.loadQuotaFromStorage();
        this.quotaExceeded = false;
        this.watchStates = this.loadWatchStates();
        this.setupWindowFocusListener();
    }

    loadQuotaFromStorage() {
        const stored = localStorage.getItem('youtube_quota');
        if (stored) {
            const quota = JSON.parse(stored);
            if (quota.lastReset < new Date().setHours(0,0,0,0)) {
                this.resetDailyQuota();
            } else {
                this.dailyQuota = quota;
            }
        }
    }

    saveQuotaToStorage() {
        localStorage.setItem('youtube_quota', JSON.stringify(this.dailyQuota));
    }

    updateQuota(cost) {
        this.dailyQuota.used += cost;
        this.saveQuotaToStorage();
        window.dispatchEvent(new CustomEvent('quotaUpdate', {
            detail: {
                used: this.dailyQuota.used,
                limit: this.dailyQuota.limit,
                remaining: this.dailyQuota.limit - this.dailyQuota.used
            }
        }));
    }

    resetDailyQuota() {
        this.dailyQuota = {
            used: 0,
            limit: 10000,
            lastReset: new Date().setHours(0,0,0,0)
        };
        this.saveQuotaToStorage();
    }

    async init() {
        try {
            const client = google.accounts.oauth2.initTokenClient({
                client_id: this.clientId,
                scope: 'https://www.googleapis.com/auth/youtube.readonly',
                callback: (tokenResponse) => {
                    if (tokenResponse.error !== undefined) {
                        throw tokenResponse;
                    }
                    this.accessToken = tokenResponse.access_token;
                }
            });

            return new Promise((resolve) => {
                client.requestAccessToken();
                const checkToken = setInterval(() => {
                    if (this.accessToken) {
                        clearInterval(checkToken);
                        resolve(true);
                    }
                }, 100);
            });
        } catch (error) {
            console.error('Error en la inicialización:', error);
            return false;
        }
    }

    async handleApiError(error) {
        if (error?.response?.status === 403 || 
            error?.message?.includes('quota') || 
            error?.error?.message?.includes('quota')) {
            
            this.quotaExceeded = true;
            window.dispatchEvent(new CustomEvent('quotaExceeded'));
            throw new Error('Cuota de API excedida');
        }
        throw error;
    }

    async getVideoMetadata(videoId) {
        if (this.quotaExceeded) {
            throw new Error('Cuota de API excedida');
        }

        if (this.videoCache.has(videoId)) {
            return this.videoCache.get(videoId);
        }

        try {
            const response = await fetch(
                `https://www.googleapis.com/youtube/v3/videos?` +
                `part=snippet,contentDetails,status&id=${videoId}`, {
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`
                }
            });
            
            if (!response.ok) {
                throw { response, error: await response.json() };
            }

            const data = await response.json();
            
            const quotaCost = parseInt(response.headers.get('x-quota-cost')) || 1;
            this.updateQuota(quotaCost);

            console.log(`Cuota usada en esta llamada: ${quotaCost}`);
            console.log(`Endpoint: videos.list, Video ID: ${videoId}`);

            if (!data.items?.[0]) return null;

            const parsedData = this.parseVideoDescription(data.items[0]);
            if (parsedData) {
                parsedData.isPrivate = data.items[0].status.privacyStatus === 'private';
                this.videoCache.set(videoId, parsedData);
                return parsedData;
            }
            return null;
        } catch (error) {
            return this.handleApiError(error);
        }
    }

    async getPrivateVideos() {
        try {
            console.log('Intentando obtener videos privados...');
            
            // Obtener ID de la lista de subidos
            const channelResponse = await fetch(
                `https://www.googleapis.com/youtube/v3/channels?` +
                `part=contentDetails&id=${this.channelId}`, {
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`
                }
            });
            
            const channelData = await channelResponse.json();
            const uploadsPlaylistId = channelData.items[0].contentDetails.relatedPlaylists.uploads;

            // Obtener videos de la lista
            const videosResponse = await fetch(
                `https://www.googleapis.com/youtube/v3/playlistItems?` +
                `part=snippet,contentDetails,status&playlistId=${uploadsPlaylistId}&maxResults=50`, {
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`
                }
            });

            const videosData = await videosResponse.json();

            // Obtener detalles completos de cada video
            const videoIds = [...new Set(videosData.items.map(item => item.contentDetails.videoId))];
            console.log('IDs únicos encontrados:', videoIds);

            const detailsResponse = await fetch(
                `https://www.googleapis.com/youtube/v3/videos?` +
                `part=status&id=${videoIds.join(',')}&key=${this.apiKey}`, {
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`
                }
            });

            const detailsData = await detailsResponse.json();

            // Filtrar videos privados
            const privateVideos = detailsData.items
                .filter(video => video.status.privacyStatus === 'private')
                .map(video => video.id);

            console.log('Videos privados filtrados:', privateVideos);
            return privateVideos;
        } catch (error) {
            console.error('Error detallado obteniendo videos privados:', error);
            return [];
        }
    }

    parseVideoDescription(videoItem) {
        console.log('=== INICIO PROCESAMIENTO DE VIDEO ===');
        console.log('Título:', videoItem.snippet.title);
        console.log('Status del video:', videoItem.status?.privacyStatus);
        
        const description = videoItem.snippet.description;
        console.log('Descripción completa:', description);
        
        const metadata = {};
        let hasValidFormat = false;
        
        const metadataRegex = /\[(.*?):\s*(.*?)\]/g;
        let match;
        
        while ((match = metadataRegex.exec(description)) !== null) {
            const [_, key, value] = match;
            const normalizedKey = key.toLowerCase();
            console.log('Metadata encontrada ->', normalizedKey + ':', value);
            
            if (normalizedKey === 'type') {
                hasValidFormat = true;
                metadata.type = value.toLowerCase();
                console.log('Tipo de video detectado:', metadata.type);
            } else {
                switch(normalizedKey) {
                    case 'titulo':
                    case 'series':
                        metadata.series = value;
                        console.log('Serie/Título:', value);
                        break;
                    case 'director':
                    case 'autor':
                        metadata.author = value;
                        console.log('Director/Autor:', value);
                        break;
                    case 'actors':
                        metadata.actors = value.split(',').map(a => a.trim());
                        console.log('Actores:', metadata.actors);
                        break;
                    case 'season':
                        metadata.season = parseInt(value);
                        console.log('Temporada:', metadata.season);
                        break;
                    case 'episode':
                        metadata.episode = parseInt(value);
                        metadata.episodeTitle = value.replace(/^\d+\s*/, '').trim();
                        console.log('Episodio:', metadata.episode, 'Título:', metadata.episodeTitle);
                        break;
                    case 'unidad':
                        // Extraer el número de unidad del inicio del valor
                        const unitMatch = value.match(/^(\d+)/);
                        metadata.unit = unitMatch ? parseInt(unitMatch[1]) : 0;
                        metadata.unitName = value;
                        console.log('Unidad:', metadata.unit, 'Nombre:', metadata.unitName);
                        break;
                    case 'plataforma':
                        metadata.platform = value;
                        console.log('Plataforma:', metadata.platform);
                        break;
                    case 'synopsis':
                        metadata.synopsis = value.trim();
                        console.log('Sinopsis:', metadata.synopsis);
                        break;
                }
            }
        }

        // Si no se encontró sinopsis en los metadatos, buscar en el texto completo
        if (!metadata.synopsis) {
            const synopsisMatch = description.match(/\[SYNOPSIS:\s*(.*?)\]/s);
            if (synopsisMatch) {
                metadata.synopsis = synopsisMatch[1].trim();
                console.log('Sinopsis encontrada en texto completo:', metadata.synopsis);
            }
        }

        if (!hasValidFormat) {
            console.log('❌ Video sin formato válido');
            return null;
        }

        console.log('=== RESUMEN DE METADATA ===');
        console.log(metadata);
        console.log('=== FIN PROCESAMIENTO DE VIDEO ===');

        return {
            id: videoItem.id,
            title: videoItem.snippet.title,
            description: description,
            thumbnail: videoItem.snippet.thumbnails?.high?.url || videoItem.snippet.thumbnails?.default?.url,
            isPrivate: videoItem.status?.privacyStatus === 'private',
            ...metadata
        };
    }

    loadWatchStates() {
        return JSON.parse(localStorage.getItem('tubevault_watch_states') || '{}');
    }

    saveWatchStates() {
        localStorage.setItem('tubevault_watch_states', JSON.stringify(this.watchStates));
    }

    setupWindowFocusListener() {
        let lastVideoOpened = null;

        // Cuando se abre un video
        window.addEventListener('blur', () => {
            if (lastVideoOpened && this.watchStates[lastVideoOpened]?.state === 'started') {
                // El usuario probablemente está viendo el video
                this.showWatchConfirmation(lastVideoOpened);
            }
        });
    }

    showWatchConfirmation(videoId) {
        // Mostrar un pequeño popup cuando el usuario regrese
        const notification = document.createElement('div');
        notification.className = 'watch-notification';
        notification.innerHTML = `
            <p>¿Terminaste de ver el video?</p>
            <button class="yes">Sí</button>
            <button class="no">No</button>
        `;
        
        // Agregar al DOM y manejar respuestas
    }

    markVideoAs(videoId, state) {
        this.watchStates[videoId] = {
            state: state,
            timestamp: Date.now()
        };
        this.saveWatchStates();
        // Emitir evento para actualizar UI
        window.dispatchEvent(new CustomEvent('watchStateChanged', { 
            detail: { videoId, state } 
        }));
    }
} 