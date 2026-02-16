/**
 * Main Application Controller
 * Navigation: TV Remote / Gestures / Keyboard - NO VISIBLE UI DURING PLAYBACK
 */

class IPTVApp {
    constructor() {
        this.player = null;
        this.ui = null;
        this.playlistManager = null;
        this.storage = null;
        
        this.playlists = [];
        this.currentPlaylist = null;
        this.channels = [];
        this.currentChannelIndex = -1;
        
        // Gesture tracking
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.touchEndX = 0;
        this.touchEndY = 0;
        
        this.init();
    }
    
    init() {
        console.log('🚀 Initializing IPTV App...');
        
        // Initialize modal manager first
        window.modal = new ModalManager();
        
        // Initialize modules
        this.player = new VideoPlayer();
        this.ui = new UIManager();
        this.playlistManager = new PlaylistManager();
        this.storage = new StorageManager();
        
        // Setup event listeners
        this.setupEventListeners();
        this.setupGestureControls();
        this.setupKeyboardControls();
        
        // Load saved data
        this.loadSavedData();
        
        // Check if first time or no playlists
        if (this.storage.isFirstTime() || this.playlists.length === 0) {
            console.log('First time - showing welcome screen');
            this.ui.showWelcomeScreen();
        } else {
            console.log('Returning user');
            this.resumeLastChannel();
        }
        
        // Hide video controls after a short delay
        setTimeout(() => {
            this.hideVideoControls();
        }, 500);
        
        console.log('✅ IPTV App initialized');
    }
    
    /**
     * HIDE VIDEO CONTROLS PERMANENTLY
     */
    hideVideoControls() {
        const videoOverlay = document.getElementById('videoOverlay');
        if (videoOverlay) {
            videoOverlay.style.opacity = '0';
            videoOverlay.style.visibility = 'hidden';
            videoOverlay.style.pointerEvents = 'none';
        }
        console.log('🙈 Video controls hidden');
    }
    
    setupEventListeners() {
        // Playlist management buttons
        this.setupPlaylistButtons();
        console.log('✓ Event listeners setup');
    }
    
    setupPlaylistButtons() {
        // Add Playlist URL buttons
        const btnAddPlaylistURL = document.getElementById('btnAddPlaylistURL');
        const btnWelcomeAddURL = document.getElementById('btnWelcomeAddURL');
        
        [btnAddPlaylistURL, btnWelcomeAddURL].forEach(btn => {
            if (btn) {
                btn.addEventListener('click', () => {
                    this.promptAddPlaylistUrl();
                });
            }
        });
        
        // Upload Playlist buttons
        const btnUploadPlaylist = document.getElementById('btnUploadPlaylist');
        const btnWelcomeUpload = document.getElementById('btnWelcomeUpload');
        
        [btnUploadPlaylist, btnWelcomeUpload].forEach(btn => {
            if (btn) {
                btn.addEventListener('click', () => {
                    document.getElementById('fileInput').click();
                });
            }
        });
        
        // File input
        const fileInput = document.getElementById('fileInput');
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.handleFileUpload(e.target.files[0]);
            }
            e.target.value = '';
        });
        
        // Add from sidebar
        const btnAddPlaylistFromSidebar = document.getElementById('btnAddPlaylistFromSidebar');
        if (btnAddPlaylistFromSidebar) {
            btnAddPlaylistFromSidebar.addEventListener('click', () => {
                this.ui.closeChannelSidebar();
                this.ui.openSettingsSidebar();
            });
        }
    }
    
    // ========== GESTURE CONTROLS (Mobile/Touch) ==========
    
    setupGestureControls() {
        const videoContainer = document.getElementById('videoContainer');
        
        videoContainer.addEventListener('touchstart', (e) => {
            this.touchStartX = e.changedTouches[0].screenX;
            this.touchStartY = e.changedTouches[0].screenY;
        }, { passive: true });
        
        videoContainer.addEventListener('touchend', (e) => {
            this.touchEndX = e.changedTouches[0].screenX;
            this.touchEndY = e.changedTouches[0].screenY;
            this.handleGesture();
        }, { passive: true });
        
        console.log('✓ Gesture controls enabled');
    }
    
    handleGesture() {
        const deltaX = this.touchEndX - this.touchStartX;
        const deltaY = this.touchEndY - this.touchStartY;
        const minSwipeDistance = 50;
        
        // Determine if horizontal or vertical swipe
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            // Horizontal swipe
            if (Math.abs(deltaX) > minSwipeDistance) {
                if (deltaX > 0) {
                    // Swipe RIGHT - Open channel list
                    console.log('👉 Swipe RIGHT - Opening channels');
                    this.ui.openChannelSidebar();
                } else {
                    // Swipe LEFT - Open settings or close sidebar
                    console.log('👈 Swipe LEFT');
                    if (this.ui.channelSidebar.classList.contains('open')) {
                        this.ui.closeChannelSidebar();
                    } else {
                        this.ui.openSettingsSidebar();
                    }
                }
            }
        } else {
            // Vertical swipe
            if (Math.abs(deltaY) > minSwipeDistance) {
                if (deltaY > 0) {
                    // Swipe DOWN - Previous channel
                    console.log('👇 Swipe DOWN - Previous channel');
                    this.playPreviousChannel();
                } else {
                    // Swipe UP - Next channel
                    console.log('👆 Swipe UP - Next channel');
                    this.playNextChannel();
                }
            }
        }
    }
    
    // ========== KEYBOARD CONTROLS (Web/TV Remote) ==========
    
    setupKeyboardControls() {
        document.addEventListener('keydown', (e) => {
            // Don't interfere if typing in input
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                return;
            }
            
            // Prevent default for arrow keys
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', ' '].includes(e.key)) {
                e.preventDefault();
            }
            
            switch(e.key) {
                case 'ArrowUp':
                    console.log('⬆️ Arrow UP - Previous channel');
                    this.playPreviousChannel();
                    break;
                    
                case 'ArrowDown':
                    console.log('⬇️ Arrow DOWN - Next channel');
                    this.playNextChannel();
                    break;
                    
                case 'ArrowLeft':
                    console.log('⬅️ Arrow LEFT - Toggle channels');
                    this.ui.toggleChannelSidebar();
                    break;
                    
                case 'ArrowRight':
                    console.log('➡️ Arrow RIGHT - Toggle settings');
                    this.ui.toggleSettingsSidebar();
                    break;
                    
                case 'Enter':
                case ' ':
                    console.log('⏯️ Play/Pause');
                    this.player.togglePlayPause();
                    break;
                    
                case 'Escape':
                    console.log('🚪 ESC - Close sidebars');
                    this.ui.closeAllSidebars();
                    break;
                    
                case 'c':
                case 'C':
                    console.log('📺 C - Toggle channels');
                    this.ui.toggleChannelSidebar();
                    break;
                    
                case 's':
                case 'S':
                    console.log('⚙️ S - Toggle settings');
                    this.ui.toggleSettingsSidebar();
                    break;
            }
        });
        
        console.log('✓ Keyboard controls enabled');
    }
    
    // ========== PLAYLIST MANAGEMENT ==========
    
    async promptAddPlaylistUrl() {
        console.log('📝 Opening URL prompt...');
        
        const url = await window.modal.showPrompt(
            'Enter your M3U playlist URL below:',
            'Add Playlist',
            ''
        );
        
        console.log('📝 URL entered:', url);
        
        if (!url || url.trim() === '') {
            console.log('⚠️ No URL entered');
            return;
        }
        
        this.ui.showLoading('Loading playlist...');
        
        try {
            console.log('🔄 Loading playlist from URL...');
            const playlist = await this.playlistManager.loadFromUrl(url.trim());
            
            console.log('✅ Playlist loaded:', playlist.name);
            
            this.addPlaylist(playlist);
            this.ui.hideLoading();
            this.ui.hideWelcomeScreen();
            this.storage.setNotFirstTime();
            
            window.modal.showAlert(
                `Playlist: ${playlist.name}\n\nChannels: ${playlist.channels.length}\n\nLoaded successfully!`,
                'Success',
                'success'
            );
        } catch (error) {
            console.error('❌ Error loading playlist:', error);
            this.ui.hideLoading();
            window.modal.showAlert(
                `Failed to load playlist\n\nError: ${error.message}\n\nPlease check:\n• URL is correct\n• Internet connection\n• Playlist format`,
                'Error',
                'error'
            );
        }
    }
    
    async handleFileUpload(file) {
        console.log('📁 Uploading file:', file.name);
        this.ui.showLoading('Reading file...');
        
        try {
            const playlist = await this.playlistManager.loadFromFile(file);
            
            console.log('✅ File loaded:', playlist.name);
            
            this.addPlaylist(playlist);
            this.ui.hideLoading();
            this.ui.hideWelcomeScreen();
            this.storage.setNotFirstTime();
            
            window.modal.showAlert(
                `Playlist: ${playlist.name}\n\nChannels: ${playlist.channels.length}\n\nLoaded successfully!`,
                'Success',
                'success'
            );
        } catch (error) {
            console.error('❌ Error loading file:', error);
            this.ui.hideLoading();
            window.modal.showAlert(
                `Failed to load file\n\nError: ${error.message}\n\nPlease check the file format.`,
                'Error',
                'error'
            );
        }
    }
    
    addPlaylist(playlist) {
        console.log('➕ Adding playlist:', playlist.name);
        console.log('📋 Current playlists:', this.playlists.length);
        
        this.playlists.push(playlist);
        
        console.log('📋 New playlists count:', this.playlists.length);
        console.log('💾 Saving to storage...');
        
        this.storage.savePlaylists(this.playlists);
        
        console.log('🎵 Loading playlist...');
        this.loadPlaylist(playlist.id);
        
        console.log('🎨 Rendering playlists...');
        this.ui.renderPlaylists(this.playlists, this.currentPlaylist?.id);
        
        console.log('✓ Playlist added successfully');
    }
    
    loadPlaylist(playlistId) {
        console.log('📂 Loading playlist ID:', playlistId);
        
        const playlist = this.playlists.find(p => p.id === playlistId);
        
        if (!playlist) {
            console.error('❌ Playlist not found:', playlistId);
            return;
        }
        
        console.log('✓ Playlist found:', playlist.name);
        
        this.currentPlaylist = playlist;
        this.channels = playlist.channels;
        this.storage.saveCurrentPlaylist(playlistId);
        
        console.log('📺 Channels loaded:', this.channels.length);
        
        // Render channels
        this.ui.renderChannels(this.channels, this.currentChannelIndex);
        
        // Show channel list
        if (this.channels.length > 0) {
            document.getElementById('emptyChannelState').style.display = 'none';
            document.getElementById('channelList').style.display = 'block';
            
            // Auto play first channel
            console.log('▶️ Auto-playing first channel...');
            this.currentChannelIndex = 0;
            this.playCurrentChannel();
        } else {
            console.warn('⚠️ No channels found');
        }
        
        console.log('✓ Playlist loaded successfully');
    }
    
    async deletePlaylist(playlistId) {
        console.log('🗑️ Delete playlist requested:', playlistId);
        
        const confirmed = await window.modal.showConfirm(
            'Are you sure you want to delete this playlist?\n\nThis action cannot be undone.',
            'Delete Playlist'
        );
        
        console.log('Delete confirmation:', confirmed);
        
        if (!confirmed) {
            console.log('❌ Delete cancelled');
            return;
        }
        
        console.log('✓ Deleting playlist...');
        
        this.playlists = this.playlists.filter(p => p.id !== playlistId);
        this.storage.savePlaylists(this.playlists);
        
        console.log('📋 Remaining playlists:', this.playlists.length);
        
        if (this.currentPlaylist?.id === playlistId) {
            console.log('⚠️ Deleted current playlist, resetting...');
            this.currentPlaylist = null;
            this.channels = [];
            this.currentChannelIndex = -1;
            this.player.stop();
            this.ui.updateChannelInfo(null);
            this.ui.renderChannels([], -1);
            document.getElementById('emptyChannelState').style.display = 'flex';
            document.getElementById('channelList').style.display = 'none';
        }
        
        this.ui.renderPlaylists(this.playlists, this.currentPlaylist?.id);
        
        if (this.playlists.length === 0) {
            console.log('📭 No playlists left, showing welcome screen');
            this.ui.showWelcomeScreen();
        }
        
        console.log('✓ Playlist deleted successfully');
    }
    
    // ========== CHANNEL NAVIGATION ==========
    
    playChannel(index) {
        if (index < 0 || index >= this.channels.length) {
            console.warn('⚠️ Invalid channel index:', index);
            return;
        }
        
        this.currentChannelIndex = index;
        this.playCurrentChannel();
    }
    
    playNextChannel() {
        if (this.channels.length === 0) {
            console.warn('⚠️ No channels loaded');
            return;
        }
        
        this.currentChannelIndex++;
        if (this.currentChannelIndex >= this.channels.length) {
            this.currentChannelIndex = 0;
            console.log('🔄 Wrapped to first channel');
        }
        
        this.playCurrentChannel();
    }
    
    playPreviousChannel() {
        if (this.channels.length === 0) {
            console.warn('⚠️ No channels loaded');
            return;
        }
        
        this.currentChannelIndex--;
        if (this.currentChannelIndex < 0) {
            this.currentChannelIndex = this.channels.length - 1;
            console.log('🔄 Wrapped to last channel');
        }
        
        this.playCurrentChannel();
    }
    
    playCurrentChannel() {
        if (this.currentChannelIndex >= 0 && this.currentChannelIndex < this.channels.length) {
            const channel = this.channels[this.currentChannelIndex];
            
            console.log(`▶️ Playing: [${this.currentChannelIndex + 1}/${this.channels.length}] ${channel.name}`);
            
            this.player.playChannel(channel);
            this.ui.updateChannelInfo(channel, this.currentChannelIndex + 1);
            this.ui.highlightCurrentChannel(this.currentChannelIndex);
            
            if (this.currentPlaylist) {
                this.storage.saveLastChannel(this.currentPlaylist.id, this.currentChannelIndex);
            }
            
            // Close channel sidebar on mobile after selection
            if (window.innerWidth < 768) {
                setTimeout(() => {
                    this.ui.closeChannelSidebar();
                }, 300);
            }
        } else {
            console.error('❌ Invalid channel index:', this.currentChannelIndex);
        }
    }
    
    // ========== LOAD SAVED DATA ==========
    
    loadSavedData() {
        this.playlists = this.storage.loadPlaylists();
        console.log('📚 Loaded playlists:', this.playlists.length);
        
        if (this.playlists.length > 0) {
            const lastPlaylistId = this.storage.loadCurrentPlaylist();
            const playlistToLoad = lastPlaylistId 
                ? this.playlists.find(p => p.id === lastPlaylistId) 
                : this.playlists[0];
            
            if (playlistToLoad) {
                this.currentPlaylist = playlistToLoad;
                this.channels = playlistToLoad.channels;
                this.ui.renderChannels(this.channels, -1);
                document.getElementById('emptyChannelState').style.display = 'none';
                document.getElementById('channelList').style.display = 'block';
                
                console.log('✓ Last playlist loaded:', playlistToLoad.name);
            }
            
            this.ui.renderPlaylists(this.playlists, this.currentPlaylist?.id);
        } else {
            console.log('📭 No saved playlists');
        }
    }
    
    resumeLastChannel() {
        const lastChannel = this.storage.loadLastChannel();
        
        if (lastChannel && this.currentPlaylist && lastChannel.playlistId === this.currentPlaylist.id) {
            this.currentChannelIndex = lastChannel.channelIndex;
            
            if (this.currentChannelIndex >= 0 && this.currentChannelIndex < this.channels.length) {
                this.ui.updateChannelInfo(
                    this.channels[this.currentChannelIndex], 
                    this.currentChannelIndex + 1
                );
                this.ui.highlightCurrentChannel(this.currentChannelIndex);
                console.log('📍 Ready to resume:', this.channels[this.currentChannelIndex].name);
            }
        } else {
            console.log('📍 No last channel to resume');
        }
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('🌐 DOM Content Loaded');
    window.app = new IPTVApp();
});