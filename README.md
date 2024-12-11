# 🎬 TubeVault
> Your Private YouTube Collection

*Read this in [English](README.md) | [Español](README.es.md)*

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-1.0.0-green.svg)

TubeVault is a static webpage that acts as a media server, allowing you to access and organize your YouTube videos in an interface similar to services like Plex or Jellyfin. With TubeVault, you can create your own collection of movies, series, and personal videos, accessing them easily and quickly.

## ✨ Features

🎯 **Smart Organization**
- Movies, Series and Personal Videos
- Search by title, director, or actors
- Rich metadata (director, actors, synopsis)

🎨 **Modern Interface**
- Responsive design
- TMDB posters
- Streaming-style interface

💾 **Optimization**
- Local cache
- Lazy image loading
- Automatic updates

## 🛠️ Installation and Setup

### 1. Prerequisites

**Python**
- Python 3.x is required
- Download from [python.org](https://www.python.org/downloads/) if not installed
- Verify installation with `python3 --version`

### 2. API Configuration

#### YouTube Data API v3
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project
3. Enable YouTube Data API v3
4. In the "Credentials" panel:
   - Create an API Key
   - Configure OAuth 2.0:
     - Create an OAuth 2.0 Client ID
     - In "Authorized JavaScript origins" add:
       ```
       http://localhost:8000
       http://127.0.0.1:8000
       ```
     - In "Authorized redirect URIs" add:
       ```
       http://localhost:8000
       http://127.0.0.1:8000
       ```

#### TMDB API
1. Create an account at [TMDB](https://www.themoviedb.org/signup)
2. Go to API settings
3. Request an API Key

### 3. Project Configuration

1. Clone the repository
2. Rename `scripts/config.example.js` to `scripts/config.js`
3. In `scripts/config.js`, replace the values with your keys:
```javascript
const CONFIG = {
    youtubeApiKey: 'YOUR_YOUTUBE_API_KEY',     // YouTube API Key from Google Cloud Console
    oauthClientId: 'YOUR_OAUTH_CLIENT_ID',     // OAuth 2.0 Client ID from Google Cloud Console
    channelId: 'YOUR_CHANNEL_ID',             // Your YouTube channel ID
    tmdbApiKey: 'YOUR_TMDB_API_KEY',         // TMDB API Key
    updateInterval: 3600000,                 // Update interval in ms
    unlistedVideos: []                      // No need to modify
};
```

### 4. Run the Server

1. Open a terminal in the project directory
2. Run the command:
   ```bash
   python3 -m http.server 8000
   ```
3. Open your browser and go to `http://localhost:8000`

## 📝 Usage and Video Format

### Description Format
For TubeVault to properly process your videos, use this format in the description:

#### For Movies
```
[DIRECTOR: Director Name]
[ACTORS: Actor 1, Actor 2, Actor 3]
[SYNOPSIS: Movie description]
```

#### For Series
```
[SEASON: 1]
[UNIT: 3]
[EPISODE: 5]
[SYNOPSIS: Episode description]
```

#### For Courses
```
[UNIT: 2]
[EPISODE: 1]
[SYNOPSIS: Lesson description]
```

### Format Notes
- Tags must be in UPPERCASE and between brackets
- Synopsis can contain multiple lines
- For series and courses:
  - SEASON is optional
  - UNIT groups episodes into sections
  - EPISODE determines playback order

## ⚠️ Considerations

- YouTube API has a daily limit of 10,000 units
- Use with your own or authorized content
- Private videos update automatically

## 🤖 AI Development

This project was developed with assistance from Claude (Anthropic). As such:
- Code can be optimized
- Better practices may exist
- Improvements and suggestions are welcome

## ☕ Support the Project

If you find this project useful and want to support its development:

[![Buy Me A Coffee](https://img.shields.io/badge/Buy%20Me%20A%20Coffee-Support-yellow.svg?style=flat-square&logo=buy-me-a-coffee)](https://buymeacoffee.com/chugeno)

Your support helps maintain and improve TubeVault! 

## 🤝 Contributing

Contributions are welcome!
- 🐛 Report bugs
- 💡 Suggest improvements
- 🔧 Submit pull requests

## 📄 License

MIT License - see [LICENSE.md](LICENSE.md)

## ⚖️ Disclaimer

This project is for personal and educational use. Do not encourage copyright infringement.

---
Made with ❤️ using YouTube Data API and TMDB
