/**
 * Playlist Manager
 * Handles loading, saving, and managing playlists
 */

class PlaylistManager {
    constructor() {
        this.parser = new PlaylistParser();
        this.playlists = [];
        this.currentPlaylistId = null;
        console.log('✓ PlaylistManager initialized');
    }
    
    /**
     * Load playlist from URL
     */
    async loadFromUrl(url) {
        try {
            console.log('📥 Loading playlist from URL:', url);
            
            const response = await fetch(url);
            console.log('📡 Response status:', response.status);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const content = await response.text();
            console.log('📄 Content length:', content.length);
            
            if (!this.parser.isValidM3U(content)) {
                throw new Error('Invalid M3U format');
            }
            
            const channels = this.parser.parse(content);
            console.log('📺 Parsed channels:', channels.length);
            
            if (channels.length === 0) {
                throw new Error('No channels found in playlist');
            }
            
            // Create playlist object
            const playlist = {
                id: this.generateId(),
                name: this.getPlaylistNameFromUrl(url),
                url: url,
                channels: channels,
                dateAdded: new Date().toISOString()
            };
            
            console.log('✓ Playlist created:', playlist.name);
            return playlist;
            
        } catch (error) {
            console.error('❌ Error loading playlist:', error);
            throw error;
        }
    }
    
    /**
     * Load playlist from file
     */
    async loadFromFile(file) {
        return new Promise((resolve, reject) => {
            console.log('📁 Loading from file:', file.name);
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const content = e.target.result;
                    
                    if (!this.parser.isValidM3U(content)) {
                        reject(new Error('Invalid M3U format'));
                        return;
                    }
                    
                    const channels = this.parser.parse(content);
                    console.log('📺 Channels from file:', channels.length);
                    
                    if (channels.length === 0) {
                        reject(new Error('No channels found in playlist'));
                        return;
                    }
                    
                    // Create playlist object
                    const playlist = {
                        id: this.generateId(),
                        name: file.name.replace(/\.(m3u|m3u8)$/i, ''),
                        url: null,
                        channels: channels,
                        dateAdded: new Date().toISOString()
                    };
                    
                    console.log('✓ Playlist from file created');
                    resolve(playlist);
                    
                } catch (error) {
                    console.error('❌ Error reading file:', error);
                    reject(error);
                }
            };
            
            reader.onerror = () => {
                reject(new Error('Failed to read file'));
            };
            
            reader.readAsText(file);
        });
    }
    
    /**
     * Generate unique ID
     */
    generateId() {
        return 'playlist_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    /**
     * Get playlist name from URL
     */
    getPlaylistNameFromUrl(url) {
        try {
            const urlObj = new URL(url);
            const pathname = urlObj.pathname;
            const filename = pathname.split('/').pop();
            return filename.replace(/\.(m3u|m3u8)$/i, '') || 'Playlist';
        } catch (e) {
            return 'Playlist';
        }
    }
}