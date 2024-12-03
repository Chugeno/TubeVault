class VideoApp {
    constructor() {
        this.api = new YouTubeAPI(CONFIG.youtubeApiKey, CONFIG.channelId);
        this.tmdb = new TMDBAPI(CONFIG.tmdbApiKey);
        this.videos = [];
        this.init();
    }

    async init() {
        await this.loadVideos();
        this.renderGrid();
        this.setupEventListeners();
    }

    async loadVideos() {
        const cachedData = localStorage.getItem('videoData');
        if (cachedData) {
            this.videos = JSON.parse(cachedData);
        }
        
        const lastUpdate = localStorage.getItem('lastUpdate');
        if (!lastUpdate || Date.now() - lastUpdate > CONFIG.updateInterval) {
            await this.updateVideos();
        }
    }

    async updateVideos() {
        try {
            // 1. Obtener videos públicos del canal
            const response = await fetch(
                `https://www.googleapis.com/youtube/v3/search?` +
                `key=${CONFIG.youtubeApiKey}&channelId=${CONFIG.channelId}` +
                `&part=snippet&type=video&maxResults=50`
            );
            const data = await response.json();
            
            const publicVideos = await Promise.all(
                data.items.map(async item => ({
                    ...await this.api.getVideoMetadata(item.id.videoId),
                    category: 'public'
                }))
            );

            // 2. Obtener videos no listados
            const unlistedVideos = await Promise.all(
                CONFIG.unlistedVideos.map(async videoId => ({
                    ...await this.api.getVideoMetadata(videoId),
                    category: metadata.type === 'movie' ? 'movies' : 'series'
                }))
            );

            this.videos = [...publicVideos, ...unlistedVideos];
            localStorage.setItem('videoData', JSON.stringify(this.videos));
            localStorage.setItem('lastUpdate', Date.now());

            this.renderGrid();
        } catch (error) {
            console.error('Error actualizando videos:', error);
        }
    }

    setupEventListeners() {
        // Manejar clics en las tarjetas de video
        document.getElementById('videoGrid').addEventListener('click', (e) => {
            const card = e.target.closest('.video-card');
            if (card) {
                this.playVideo(card.dataset.id);
            }
        });

        // Manejar búsqueda
        document.getElementById('searchBar').addEventListener('input', (e) => {
            this.filterVideos(e.target.value);
        });

        // Manejar filtros de navegación
        document.querySelector('.nav-items').addEventListener('click', (e) => {
            if (e.target.classList.contains('nav-item')) {
                this.filterByType(e.target.textContent.toLowerCase());
            }
        });

        // Cerrar modal
        const modal = document.getElementById('playerModal');
        
        // Botón de cerrar
        const closeButton = document.createElement('button');
        closeButton.className = 'modal-close';
        closeButton.innerHTML = '×';
        modal.querySelector('.modal-content').appendChild(closeButton);
        
        closeButton.addEventListener('click', () => this.closeModal());
        
        // Click fuera del modal
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeModal();
            }
        });
        
        // Tecla ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
            }
        });
    }

    closeModal() {
        const modal = document.getElementById('playerModal');
        const player = document.getElementById('player');
        modal.style.display = 'none';
        player.innerHTML = ''; // Detiene el video
    }

    playVideo(videoId) {
        const modal = document.getElementById('playerModal');
        const player = document.getElementById('player');
        const videoInfo = document.getElementById('videoInfo');
        const video = this.videos.find(v => v.id === videoId);

        // Limpiar contenido anterior
        player.innerHTML = '';
        videoInfo.innerHTML = '';

        if (video.type === 'series') {
            // Si es una serie, primero mostrar solo la lista de episodios
            player.innerHTML = '';
            const allEpisodes = this.videos.filter(v => 
                v.type === 'series' && v.series === video.series
            ).sort((a, b) => 
                (a.season - b.season) || (a.episode - b.episode)
            );

            // Obtener póster para el modal
            this.getTMDBData(video).then(tmdbData => {
                const posterUrl = tmdbData?.posterPath || video.thumbnail;
                
                videoInfo.innerHTML = `
                    <div class="modal-header">
                        ${tmdbData?.posterPath ? `
                            <div class="modal-poster">
                                <img src="${posterUrl}" alt="${video.series}">
                            </div>
                        ` : ''}
                        <div class="modal-info">
                            <h2>${video.series}</h2>
                            <div class="video-metadata">
                                ${video.director ? `<p><strong>Director:</strong> <span class="clickable-name">${video.director}</span></p>` : ''}
                                ${video.actors?.length ? `
                                    <p><strong>Actores:</strong> ${video.actors.map(actor => 
                                        `<span class="clickable-name">${actor}</span>`
                                    ).join(', ')}</p>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                    <div class="episodes-list">
                        <h3>Episodios</h3>
                        ${this.createEpisodesMenu(allEpisodes)}
                    </div>
                `;

                // Agregar event listeners para los episodios
                videoInfo.querySelectorAll('.episode-button').forEach(button => {
                    button.addEventListener('click', () => {
                        const episodeId = button.dataset.id;
                        this.playEpisode(episodeId);
                    });
                });
            });
        } else {
            // Si no es serie, reproducir normalmente
            this.playEpisode(videoId);
            
            // Mostrar información sin póster
            videoInfo.innerHTML = `
                <div class="modal-info">
                    <h2>${video.title}</h2>
                    <div class="video-metadata">
                        ${video.director ? `<p><strong>Director:</strong> <span class="clickable-name">${video.director}</span></p>` : ''}
                        ${video.actors?.length ? `
                            <p><strong>Actores:</strong> ${video.actors.map(actor => 
                                `<span class="clickable-name">${actor}</span>`
                            ).join(', ')}</p>
                        ` : ''}
                    </div>
                </div>
            `;
        }

        modal.style.display = 'block';
    }

    // Nuevo método para reproducir episodios
    playEpisode(videoId) {
        const player = document.getElementById('player');
        const video = this.videos.find(v => v.id === videoId);

        // Actualizar el reproductor
        player.innerHTML = `
            <iframe 
                width="100%" 
                height="500" 
                src="https://www.youtube.com/embed/${videoId}?autoplay=1" 
                frameborder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope" 
                allowfullscreen>
            </iframe>
        `;

        // Actualizar botón activo
        document.querySelectorAll('.episode-button').forEach(button => {
            button.classList.toggle('active', button.dataset.id === videoId);
        });
    }

    createEpisodesMenu(episodes, currentId = null) {
        let currentSeason = null;
        let html = '<div class="seasons">';
        
        episodes.forEach(ep => {
            if (ep.season !== currentSeason) {
                if (currentSeason !== null) html += '</div>';
                currentSeason = ep.season;
                html += `<div class="season">
                    <h4>Temporada ${ep.season}</h4>`;
            }
            html += `
                <button class="episode-button ${ep.id === currentId ? 'active' : ''}"
                    data-id="${ep.id}">
                    Episodio ${ep.episode}
                </button>`;
        });
        
        html += '</div></div>';
        return html;
    }

    filterVideos(query) {
        query = query.toLowerCase();
        const filteredVideos = this.videos.filter(video => 
            video.title.toLowerCase().includes(query) ||
            video.director?.toLowerCase().includes(query) ||
            video.actors?.some(actor => actor.toLowerCase().includes(query))
        );
        this.renderGrid(filteredVideos);
    }

    filterByType(type) {
        // Actualizar botón activo
        document.querySelectorAll('.nav-item').forEach(button => {
            button.classList.remove('active');
            if (button.textContent.toLowerCase() === type.toLowerCase()) {
                button.classList.add('active');
            }
        });

        // Resto del código de filtrado...
        let filteredVideos = this.videos;
        switch(type.toLowerCase()) {
            case 'peliculas':
            case 'películas':
                filteredVideos = this.videos.filter(v => v.category === 'movies');
                break;
            case 'series':
                filteredVideos = this.videos.filter(v => v.category === 'series');
                break;
            case 'mis videos':
                filteredVideos = this.videos.filter(v => v.category === 'public');
                break;
            case 'todo':
                filteredVideos = this.videos; // Mostrar todos los videos
                break;
        }
        this.renderGrid(filteredVideos);
    }

    async renderGrid(videos = this.videos) {
        const grid = document.getElementById('videoGrid');
        
        // Agrupar episodios de series
        const groupedVideos = videos.reduce((acc, video) => {
            if (video.type === 'series') {
                const seriesKey = video.series;
                if (!acc[seriesKey]) {
                    acc[seriesKey] = video;
                }
            } else {
                acc[video.id] = video;
            }
            return acc;
        }, {});

        // Crear todas las tarjetas de video de forma asíncrona
        const videoCards = await Promise.all(
            Object.values(groupedVideos).map(video => this.createVideoCard(video))
        );

        grid.innerHTML = videoCards.join('');
    }

    async createVideoCard(video) {
        let imageUrl = video.thumbnail; // Por defecto usa la miniatura de YouTube

        if (video.type === 'series' || video.type === 'movie') {
            const searchTitle = video.type === 'series' ? video.series : video.title;
            const tmdbData = await (video.type === 'series' ? 
                this.tmdb.searchSeries(searchTitle) : 
                this.tmdb.searchMovie(searchTitle));
            
            // Usar póster si está disponible
            if (tmdbData?.posterPath) {
                imageUrl = tmdbData.posterPath;
            }
        }

        return `
            <div class="video-card" data-id="${video.id}">
                <div class="card-image-container">
                    <img src="${imageUrl}" alt="${video.type === 'series' ? video.series : video.title}">
                </div>
                <div class="video-info">
                    <h3>${video.type === 'series' ? video.series : video.title}</h3>
                </div>
            </div>
        `;
    }

    filterByPerson(name) {
        const filteredVideos = this.videos.filter(video => 
            video.director === name || 
            video.actors?.includes(name)
        );
        this.renderGrid(filteredVideos);
    }

    // Método auxiliar para obtener datos de TMDB
    async getTMDBData(video) {
        if (video.type === 'series' || video.type === 'movie') {
            const searchTitle = video.type === 'series' ? video.series : video.title;
            return await (video.type === 'series' ? 
                this.tmdb.searchSeries(searchTitle) : 
                this.tmdb.searchMovie(searchTitle));
        }
        return null;
    }
}

// Iniciar la aplicación
document.addEventListener('DOMContentLoaded', () => {
    window.app = new VideoApp();
}); 