class TMDBAPI {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseURL = 'https://api.themoviedb.org/3';
        this.imageBaseURL = 'https://image.tmdb.org/t/p/w500';
    }

    async searchSeries(title) {
        try {
            const response = await fetch(
                `${this.baseURL}/search/tv?` +
                `api_key=${this.apiKey}&query=${encodeURIComponent(title)}`
            );
            const data = await response.json();
            
            if (data.results && data.results.length > 0) {
                const series = data.results[0];
                return {
                    posterPath: series.poster_path ? 
                        `${this.imageBaseURL}${series.poster_path}` : null,
                    backdropPath: series.backdrop_path ?
                        `${this.imageBaseURL}${series.backdrop_path}` : null
                };
            }
            return null;
        } catch (error) {
            console.error('Error buscando en TMDB:', error);
            return null;
        }
    }

    async searchMovie(title) {
        try {
            const response = await fetch(
                `${this.baseURL}/search/movie?` +
                `api_key=${this.apiKey}&query=${encodeURIComponent(title)}`
            );
            const data = await response.json();
            
            if (data.results && data.results.length > 0) {
                const movie = data.results[0];
                return {
                    posterPath: movie.poster_path ? 
                        `${this.imageBaseURL}${movie.poster_path}` : null,
                    backdropPath: movie.backdrop_path ?
                        `${this.imageBaseURL}${movie.backdrop_path}` : null
                };
            }
            return null;
        } catch (error) {
            console.error('Error buscando en TMDB:', error);
            return null;
        }
    }
} 