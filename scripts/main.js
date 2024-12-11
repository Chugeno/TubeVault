class VideoApp {
    constructor() {
        this.api = new YouTubeAPI(CONFIG.youtubeApiKey, CONFIG.channelId);
        this.tmdb = new TMDBAPI(CONFIG.tmdbApiKey);
        this.videos = [];
        this.categories = new Set(['todo']);
        this.storageKey = 'tubevault_';
        this.init();
        this.setupQuotaListener();
    }

    async init() {
        try {
            console.log('Iniciando aplicación...');
            const initialized = await this.api.init();
            console.log('API inicializada:', initialized);
            
            if (initialized) {
                console.log('Cargando videos...');
                await this.loadVideos();
                this.renderGrid();
                this.setupEventListeners();
            }
        } catch (error) {
            console.error('Error inicializando la app:', error);
        }
    }

    async loadVideos() {
        console.log('Método loadVideos iniciado');
        const cachedData = localStorage.getItem(this.storageKey + 'videoData');
        const lastUpdate = localStorage.getItem(this.storageKey + 'lastUpdate');
        const now = Date.now();
        
        let needsUpdate = false;
        
        // Forzar actualización si:
        // 1. No hay datos en cache
        // 2. No hay registro de última actualización
        // 3. Es una nueva sesión (window.performance.navigation.type === 1 es refresh)
        if (!cachedData || !lastUpdate || window.performance.navigation.type !== 1) {
            console.log('Actualizando datos (nueva sesión o sin cache)...');
            needsUpdate = true;
        } else {
            // Usar cache si existe y estamos en un refresh
            this.videos = JSON.parse(cachedData);
            console.log('Usando datos en cache:', this.videos.length, 'videos');
            
            // Aún así, verificar si pasó el intervalo de actualización
            const timeSinceLastUpdate = now - parseInt(lastUpdate);
            if (timeSinceLastUpdate > CONFIG.updateInterval) {
                console.log('Cache expirado, actualizando en segundo plano...');
                // Actualizar en segundo plano para no bloquear la carga inicial
                this.updateVideos().then(() => {
                    console.log('Actualización en segundo plano completada');
                });
            }
        }
        
        if (needsUpdate) {
            console.log('Actualizando videos desde YouTube...');
            await this.updateVideos();
        }
    }

    async updateVideos() {
        try {
            console.log('Método updateVideos iniciado');
            
            // 1. Videos públicos
            console.log('Buscando videos públicos...');
            const response = await fetch(
                `https://www.googleapis.com/youtube/v3/search?` +
                `key=${CONFIG.youtubeApiKey}&channelId=${CONFIG.channelId}` +
                `&part=snippet&type=video&maxResults=50`
            );
            const data = await response.json();
            
            // Obtener y filtrar videos públicos válidos
            const publicVideos = (await Promise.all(
                data.items.map(async item => {
                    const metadata = await this.api.getVideoMetadata(item.id.videoId);
                    return metadata ? {
                        ...metadata,
                        type: 'mis videos',
                        category: 'mis videos'
                    } : null;
                })
            )).filter(v => v !== null);

            // 2. Videos no listados y privados
            const processVideos = async (videoIds) => {
                return (await Promise.all(
                    videoIds.map(async videoId => {
                        const metadata = await this.api.getVideoMetadata(videoId);
                        return metadata ? {
                            ...metadata,
                            category: metadata.type
                        } : null;
                    })
                )).filter(v => v !== null);
            };

            const unlistedVideos = await processVideos(CONFIG.unlistedVideos);
            const privateVideos = await processVideos(await this.api.getPrivateVideos());

            // Filtrar duplicados
            const uniqueIds = new Set();
            this.videos = [...publicVideos, ...unlistedVideos, ...privateVideos]
                .filter(v => {
                    if (uniqueIds.has(v.id)) return false;
                    uniqueIds.add(v.id);
                    return true;
                });

            // Actualizar categorías y UI
            this.updateCategories();
            this.renderGrid();

            // Guardar en localStorage
            localStorage.setItem(this.storageKey + 'videoData', JSON.stringify(this.videos));
            localStorage.setItem(this.storageKey + 'lastUpdate', Date.now());
        } catch (error) {
            console.error('Error actualizando videos:', error);
        }
    }

    setupEventListeners() {
        // Manejar clics en las tarjetas de video
        document.getElementById('videoGrid').addEventListener('click', (e) => {
            const card = e.target.closest('.video-card');
            if (card) {
                const videoId = card.dataset.id;
                const video = this.videos.find(v => v.id === videoId);
                if (video && (video.type === 'series' || video.type === 'cursos')) {
                    this.playVideo(videoId, true); // true indica que es una serie/curso
                } else {
                    this.playVideo(videoId);
                }
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
        modal.classList.remove('show');
        setTimeout(() => {
            modal.style.display = 'none';
            const player = document.getElementById('player');
            player.innerHTML = '';
        }, 300);
    }

    async playVideo(videoId, isSeries = false) {
        console.log('1. Iniciando playVideo con ID:', videoId);
        const video = this.videos.find(v => v.id === videoId);
        console.log('2. Video encontrado:', video);
        
        if (!video) {
            console.log('Error: Video no encontrado');
            return;
        }

        // Si es video privado y no es una serie, abrir en YouTube
        if (video.isPrivate && !isSeries) {
            console.log('3. Abriendo video privado en YouTube');
            window.open(`https://www.youtube.com/watch?v=${videoId}`, '_blank');
            return;
        }

        const modal = document.getElementById('playerModal');
        const player = document.getElementById('player');
        const videoInfo = document.getElementById('videoInfo');
        console.log('3. Elementos DOM obtenidos:', { modal, player, videoInfo });

        // Limpiar contenido anterior
        player.innerHTML = '';
        videoInfo.innerHTML = '';

        // Solo mostrar el reproductor si no es una serie
        if (!isSeries) {
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
            console.log('4. Reproductor insertado');
        }

        // Crear información del video
        console.log('5. Creando información del video');
        const videoInfoHtml = await this.createVideoInfo(video);
        videoInfo.innerHTML = videoInfoHtml;

        // Si es serie o curso, agregar lista de episodios
        if (video.type === 'series' || video.type === 'cursos') {
            console.log('6. Procesando video episódico');
            const allEpisodes = this.videos.filter(v => 
                v.type === video.type && v.series === video.series
            ).sort((a, b) => 
                (video.type === 'cursos' ? 
                    (a.unit - b.unit) || (a.episode - b.episode) : 
                    (a.season - b.season) || (a.episode - b.episode))
            );
            console.log('7. Episodios encontrados:', allEpisodes.length);
            
            // Agregar lista de episodios
            const episodesHtml = this.createEpisodesMenu(allEpisodes, videoId);
            const episodesContainer = document.createElement('div');
            episodesContainer.className = 'episodes-list';
            episodesContainer.innerHTML = `
                <h3>${video.type === 'cursos' ? 'Unidades' : 'Episodios'}</h3>
                ${episodesHtml}
            `;
            videoInfo.appendChild(episodesContainer);

            // Event listeners para episodios
            videoInfo.querySelectorAll('.episode-button').forEach(button => {
                button.addEventListener('click', () => {
                    const episodeId = button.dataset.id;
                    console.log('8. Click en episodio:', episodeId);
                    const episode = this.videos.find(v => v.id === episodeId);
                    if (episode.isPrivate) {
                        window.open(`https://www.youtube.com/watch?v=${episodeId}`, '_blank');
                    } else {
                        this.playEpisode(episodeId);
                    }
                });
            });

            // Event listener para selector de sección
            const sectionSelect = videoInfo.querySelector('#sectionSelect');
            console.log('9. Selector de sección encontrado:', !!sectionSelect);
            
            if (sectionSelect) {
                sectionSelect.addEventListener('change', (e) => {
                    const selectedSection = e.target.value;
                    console.log('10. Sección seleccionada:', selectedSection);
                    
                    const sectionEpisodes = this.videos.filter(v => 
                        v.type === video.type && 
                        v.series === video.series && 
                        (video.type === 'cursos' ? v.unit : v.season) === parseInt(selectedSection)
                    ).sort((a, b) => a.episode - b.episode);

                    const episodesContainer = videoInfo.querySelector('.episodes-container');
                    if (episodesContainer) {
                        episodesContainer.style.opacity = '0';
                        
                        setTimeout(() => {
                            const episodesHtml = this.createEpisodesMenu(sectionEpisodes, videoId, false);
                            episodesContainer.innerHTML = episodesHtml;
                            episodesContainer.style.opacity = '1';
                            
                            // Reattach event listeners
                            episodesContainer.querySelectorAll('.episode-button').forEach(button => {
                                button.addEventListener('click', () => {
                                    const episodeId = button.dataset.id;
                                    const episode = this.videos.find(v => v.id === episodeId);
                                    if (episode.isPrivate) {
                                        window.open(`https://www.youtube.com/watch?v=${episodeId}`, '_blank');
                                    } else {
                                        this.playEpisode(episodeId);
                                    }
                                });
                            });
                        }, 300);
                    }
                });
            }
        }

        // Mostrar el modal
        console.log('11. Mostrando modal');
        modal.style.display = 'block';
        setTimeout(() => {
            modal.classList.add('show');
            console.log('12. Modal mostrado');
        }, 10);
    }

    // Nuevo método para reproducir episodios
    playEpisode(videoId) {
        // Abrir video en YouTube
        window.open(`https://www.youtube.com/watch?v=${videoId}`, '_blank');

        // Actualizar botón activo
        document.querySelectorAll('.episode-button').forEach(button => {
            button.classList.toggle('active', button.dataset.id === videoId);
        });
    }

    createEpisodesMenu(episodes, currentId = null, includeSelector = true) {
        const isCourse = episodes[0]?.type === 'cursos';
        const sections = new Map(); // Mapa para temporadas/unidades
        
        // Agrupar episodios por temporada/unidad
        episodes.forEach(ep => {
            const sectionKey = isCourse ? ep.unit : ep.season;
            const sectionName = isCourse ? ep.unitName : `Temporada ${ep.season}`;
            
            if (!sections.has(sectionKey)) {
                sections.set(sectionKey, {
                    name: sectionName,
                    episodes: []
                });
            }
            sections.get(sectionKey).episodes.push(ep);
        });

        // Ordenar las secciones por número
        const sortedSections = Array.from(sections.entries())
            .sort(([keyA], [keyB]) => {
                const numA = parseInt(keyA) || 0;
                const numB = parseInt(keyB) || 0;
                return numA - numB;
            });

        let html = '';
        
        // Solo incluir el selector si se especifica
        if (includeSelector) {
            html += `
                <div class="section-selector">
                    <select id="sectionSelect" class="section-select">
                        ${sortedSections.map(([key, section]) => `
                            <option value="${key}">${section.name}</option>
                        `).join('')}
                    </select>
                </div>
            `;
        }

        html += '<div class="episodes-container">';

        // Mostrar episodios de la primera sección
        const currentSection = sortedSections[0][0];
        const currentEpisodes = sections.get(currentSection).episodes
            .sort((a, b) => (a.episode || 0) - (b.episode || 0));

        html += `
            <div class="episodes-grid">
                ${currentEpisodes.map(ep => {
                    const isWatched = this.api.watchStates[ep.id]?.state === 'completed';
                    return `
                        <div class="episode-row">
                            <button class="episode-button" data-id="${ep.id}">
                                <span class="episode-number">${ep.episode}</span>
                                <span class="episode-title">${ep.episodeTitle || ''}</span>
                            </button>
                            <button class="episode-watch-button ${isWatched ? 'watched' : ''}"
                                    onclick="event.stopPropagation(); app.toggleWatched('${ep.id}')">
                                ${isWatched ? '✓ Visto' : 'Marcar visto'}
                            </button>
                        </div>
                    `;
                }).join('')}
            </div>
        `;

        html += '</div>';
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
        // Limpiar el string de espacios al inicio y final
        type = type.trim().toLowerCase();
        console.log('1. Tipo recibido después de trim:', `"${type}"`);
        
        // Actualizar botón activo
        document.querySelectorAll('.nav-item').forEach(button => {
            const buttonText = button.textContent.trim().toLowerCase();
            console.log('2. Comparando botón:', `"${buttonText}"`, 'con tipo:', `"${type}"`);
            button.classList.remove('active');
            if (buttonText === type) {
                button.classList.add('active');
            }
        });

        // Verificar si es "todo"
        console.log('3. ¿Es tipo "todo"?', type === 'todo');
        if (type === 'todo') {
            console.log('4. Mostrando todos los videos:', this.videos.length);
            this.renderGrid(this.videos);
            return;
        }

        // Para otros botones, filtrar por el tipo correspondiente
        const filteredVideos = this.videos.filter(video => {
            const videoType = video.type?.toLowerCase().trim();
            console.log('5. Tipo de video:', `"${videoType}"`, 'comparando con:', `"${type}"`);
            return videoType === type;
        });

        console.log('6. Videos filtrados:', filteredVideos.length);
        this.renderGrid(filteredVideos);
    }

    async renderGrid(videos = this.videos) {
        const grid = document.getElementById('videoGrid');
        
        // Agrupar episodios de series y cursos
        const groupedVideos = videos.reduce((acc, video) => {
            if (video.type === 'series' || video.type === 'cursos') {
                // Usar series o título como clave de agrupación
                const key = video.series;
                if (!acc[key]) {
                    acc[key] = video;
                }
            } else {
                // Para otros tipos de videos, mantener individualmente
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
        const isWatched = this.api.watchStates[video.id]?.state === 'completed';
        
        return `
            <div class="video-card" data-id="${video.id}">
                <button class="watch-button ${isWatched ? 'watched' : ''}" 
                        onclick="event.stopPropagation(); app.toggleWatched('${video.id}')">
                    ${isWatched ? '✓ Visto' : 'Marcar visto'}
                </button>
                <div class="card-image-container">
                    <img src="${video.thumbnail}" alt="${video.series || video.title}">
                </div>
                <div class="video-info">
                    <h3 class="auto-size-title">${video.series || video.title}</h3>
                    ${video.type === 'cursos' && video.platform ? 
                        `<p class="platform-tag">${video.platform}</p>` : ''}
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

    // Método para limpiar solo nuestros datos
    clearCache() {
        // Solo limpiar datos específicos de TubeVault
        const keysToKeep = ['accessToken', 'authToken']; // Agregar aquí otras claves que necesites mantener
        
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith(this.storageKey) && !keysToKeep.some(keepKey => key.includes(keepKey))) {
                console.log('Limpiando cache:', key);
                localStorage.removeItem(key);
            }
        });
    }

    updateCategories() {
        // Empezar solo con 'Todo'
        this.categories = new Set(['todo']);
        console.log('A. Categorías iniciales:', Array.from(this.categories));

        // Agregar categorías solo de videos con TYPE válido
        this.videos.forEach(video => {
            if (video?.type) {
                const type = video.type.toLowerCase().trim();
                console.log('B. Agregando tipo:', `"${type}"`, 'de video:', video.title);
                this.categories.add(type);
            }
        });

        console.log('C. Categorías finales:', Array.from(this.categories));

        // Actualizar navegación
        const navItems = document.querySelector('.nav-items');
        const buttonsHTML = Array.from(this.categories)
            .sort((a, b) => a === 'todo' ? -1 : b === 'todo' ? 1 : a.localeCompare(b))
            .map(category => {
                console.log('D. Creando botón para categoría:', `"${category}"`);
                return `
                    <button class="nav-item ${category === 'todo' ? 'active' : ''}">
                        ${this.formatCategoryName(category)}
                    </button>
                `;
            }).join('');
        
        console.log('E. HTML de botones generado:', buttonsHTML);
        navItems.innerHTML = buttonsHTML;
    }

    formatCategoryName(category) {
        // Formatear nombre de categoría para mostrar
        const categoryMap = {
            'todo': 'Todo',
            'series': 'Series',
            'movie': 'Películas',
            'mis videos': 'Mis Videos',
            'curso': 'Cursos'  // Agregado 'curso'
        };

        return categoryMap[category.toLowerCase()] || 
            category.charAt(0).toUpperCase() + category.slice(1);
    }

    async createVideoInfo(video) {
        const tmdbData = await this.getTMDBData(video);
        console.log('TMDB Data:', tmdbData);
        console.log('Video Data:', video);
        
        // Determinar la sinopsis a mostrar
        let synopsis = video.synopsis;
        
        // Si no hay sinopsis y hay descripción, buscar [SYNOPSIS: texto] en la descripción
        if (!synopsis && video.description) {
            const synopsisMatch = video.description.match(/\[SYNOPSIS:\s*(.*?)\]/s);
            if (synopsisMatch) {
                synopsis = synopsisMatch[1].trim();
            }
        }
            
        console.log('Synopsis final:', synopsis);
        console.log('Descripción completa:', video.description);
        
        return `
            <div class="modal-header">
                ${tmdbData?.posterPath ? `
                    <div class="modal-poster">
                        <img src="${tmdbData.posterPath}" alt="${video.series || video.title}">
                    </div>
                ` : ''}
                <div class="modal-info">
                    <h2>${video.series || video.title}</h2>
                    ${video.type === 'series' ? `
                        <p class="episode-info">Temporada ${video.season} - ${video.episodeTitle || `Episodio ${video.episode}`}</p>
                    ` : ''}
                    ${video.platform ? `<p><strong>Plataforma:</strong> ${video.platform}</p>` : ''}
                    <div class="video-metadata">
                        ${video.author ? `<p><strong>${video.type === 'cursos' ? 'Autor' : 'Director'}:</strong> 
                            <span class="clickable-name">${video.author}</span></p>` : ''}
                        ${video.actors?.length ? `
                            <p><strong>Actores:</strong> ${video.actors.map(actor => 
                                `<span class="clickable-name">${actor}</span>`
                            ).join(', ')}</p>
                        ` : ''}
                        ${synopsis ? `
                            <div class="synopsis">
                                <strong>Sinopsis:</strong>
                                <p>${synopsis}</p>
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    setupQuotaListener() {
        window.addEventListener('quotaUpdate', (event) => {
            const { used } = event.detail;
            const usedElement = document.getElementById('quotaUsed');

            // Actualizar contador de peticiones
            usedElement.textContent = used;
        });

        window.addEventListener('quotaExceeded', () => {
            const quotaMessage = document.getElementById('quotaMessage');
            quotaMessage.classList.add('show');
        });
    }

    // Agregar método para manejar el toggle
    toggleWatched(videoId) {
        const currentState = this.api.watchStates[videoId]?.state;
        const newState = currentState === 'completed' ? 'unwatched' : 'completed';
        this.api.markVideoAs(videoId, newState);
        
        // Actualizar TODOS los botones que representen este video
        document.querySelectorAll(`.episode-watch-button[onclick*="${videoId}"], .watch-button[onclick*="${videoId}"]`)
            .forEach(button => {
                button.classList.toggle('watched');
                button.textContent = newState === 'completed' ? '✓ Visto' : 'Marcar visto';
            });
    }
}

// Iniciar la aplicación
document.addEventListener('DOMContentLoaded', () => {
    window.app = new VideoApp();
}); 