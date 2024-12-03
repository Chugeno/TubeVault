EJEMPLOS DE USO

FORMATO PARA PELÍCULAS
```
[TYPE: MOVIE]
[DIRECTOR: Christopher Nolan]
[ACTORS: Christian Bale, Michael Caine, Heath Ledger]
[SYNOPSIS: Un vigilante enmascarado lucha contra el crimen en Gotham]
---
Descripción adicional del video...
```


FORMATO PARA SERIES
```
[TYPE: SERIES]
[SERIES: Breaking Bad]
[SEASON: 1]
[EPISODE: 1]
[DIRECTOR: Vince Gilligan]
[ACTORS: Bryan Cranston, Aaron Paul]
[SYNOPSIS: Un profesor de química se convierte en fabricante de metanfetamina]
---
Descripción adicional del episodio...
```
FORMATO PARA VIDEOS PERSONALES
```
[TYPE: PUBLIC]
[DIRECTOR: Juan Pérez]
[ACTORS: María García, Pedro López]
---
Video de la fiesta familiar...
```
NOTAS IMPORTANTES

1. El orden de los campos no importa
2. Los guiones (---) son obligatorios para separar los metadatos de la descripción
3. Para series:
   - El nombre de la serie debe ser exactamente igual en todos los episodios
   - Temporada y episodio deben ser números
4. Los actores se separan por comas
5. La descripción después de los guiones es opcional

EJEMPLO DE CONFIG.JS
```
const CONFIG = {
    youtubeApiKey: 'tu_api_key_youtube',
    channelId: 'tu_id_de_canal',
    tmdbApiKey: 'tu_api_key_tmdb',
    updateInterval: 3600000,
    unlistedVideos: [
        "dQw4w9WgXcQ",  // Breaking Bad S01E01
        "xvFZjo5PgG0"   // El Padrino
    ]
};
