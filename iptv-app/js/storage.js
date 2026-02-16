/**
 * Local Storage Manager
 * Handles saving and loading data from browser localStorage
 */

class StorageManager {
    constructor() {
        this.STORAGE_KEYS = {
            PLAYLISTS: 'iptv_playlists',
            CURRENT_PLAYLIST: 'iptv_current_playlist',
            LAST_CHANNEL: 'iptv_last_channel',
            SETTINGS: 'iptv_settings',
            FIRST_TIME: 'iptv_first_time'
        };
    }
    
    /**
     * Save playlists
     */
    savePlaylists(playlists) {
        try {
            localStorage.setItem(this.STORAGE_KEYS.PLAYLISTS, JSON.stringify(playlists));
            return true;
        } catch (e) {
            console.error('Failed to save playlists:', e);
            return false;
        }
    }
    
    /**
     * Load playlists
     */
    loadPlaylists() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEYS.PLAYLISTS);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('Failed to load playlists:', e);
            return [];
        }
    }
    
    /**
     * Save current playlist ID
     */
    saveCurrentPlaylist(playlistId) {
        localStorage.setItem(this.STORAGE_KEYS.CURRENT_PLAYLIST, playlistId);
    }
    
    /**
     * Load current playlist ID
     */
    loadCurrentPlaylist() {
        return localStorage.getItem(this.STORAGE_KEYS.CURRENT_PLAYLIST);
    }
    
    /**
     * Save last played channel
     */
    saveLastChannel(playlistId, channelIndex) {
        const data = {
            playlistId,
            channelIndex,
            timestamp: new Date().toISOString()
        };
        localStorage.setItem(this.STORAGE_KEYS.LAST_CHANNEL, JSON.stringify(data));
    }
    
    /**
     * Load last played channel
     */
    loadLastChannel() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEYS.LAST_CHANNEL);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            return null;
        }
    }
    
    /**
     * Check if first time
     */
    isFirstTime() {
        return !localStorage.getItem(this.STORAGE_KEYS.FIRST_TIME);
    }
    
    /**
     * Mark as not first time
     */
    setNotFirstTime() {
        localStorage.setItem(this.STORAGE_KEYS.FIRST_TIME, 'false');
    }
    
    /**
     * Clear all data
     */
    clearAll() {
        Object.values(this.STORAGE_KEYS).forEach(key => {
            localStorage.removeItem(key);
        });
    }
}