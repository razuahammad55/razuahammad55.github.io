/**
 * UI State Manager
 * Handles sidebar visibility, overlays, and UI interactions
 */

class UIManager {
    constructor() {
        // UI Elements
        this.videoOverlay = document.getElementById('videoOverlay');
        this.channelSidebar = document.getElementById('channelSidebar');
        this.settingsSidebar = document.getElementById('settingsSidebar');
        this.overlay = document.getElementById('overlay');
        this.welcomeScreen = document.getElementById('welcomeScreen');
        this.loadingIndicator = document.getElementById('loadingIndicator');
        
        // Buttons
        this.btnChannelList = document.getElementById('btnChannelList');
        this.btnSettings = document.getElementById('btnSettings');
        this.btnCloseSidebar = document.getElementById('btnCloseSidebar');
        this.btnCloseSettings = document.getElementById('btnCloseSettings');
        
        // Channel info
        this.channelName = document.getElementById('channelName');
        this.channelNumber = document.getElementById('channelNumber');
        
        // Lists
        this.channelList = document.getElementById('channelList');
        this.playlistList = document.getElementById('playlistList');
        
        // State
        this.overlayTimeout = null;
        
        this.init();
    }
    
    init() {
        // Sidebar toggle buttons
        this.btnChannelList.addEventListener('click', () => this.toggleChannelSidebar());
        this.btnSettings.addEventListener('click', () => this.toggleSettingsSidebar());
        this.btnCloseSidebar.addEventListener('click', () => this.closeChannelSidebar());
        this.btnCloseSettings.addEventListener('click', () => this.closeSettingsSidebar());
        
        // Overlay click to close sidebars
        this.overlay.addEventListener('click', () => this.closeAllSidebars());
        
        // Video overlay auto-hide
        this.setupOverlayAutoHide();
        
        console.log('UIManager initialized');
    }
    
    // Sidebar Management
    
    toggleChannelSidebar() {
        const isOpen = this.channelSidebar.classList.contains('open');
        if (isOpen) {
            this.closeChannelSidebar();
        } else {
            this.openChannelSidebar();
        }
    }
    
    openChannelSidebar() {
        this.closeSettingsSidebar();
        this.channelSidebar.classList.add('open');
        this.overlay.classList.add('visible');
    }
    
    closeChannelSidebar() {
        this.channelSidebar.classList.remove('open');
        this.overlay.classList.remove('visible');
    }
    
    toggleSettingsSidebar() {
        const isOpen = this.settingsSidebar.classList.contains('open');
        if (isOpen) {
            this.closeSettingsSidebar();
        } else {
            this.openSettingsSidebar();
        }
    }
    
    openSettingsSidebar() {
        this.closeChannelSidebar();
        this.settingsSidebar.classList.add('open');
        this.overlay.classList.add('visible');
    }
    
    closeSettingsSidebar() {
        this.settingsSidebar.classList.remove('open');
        this.overlay.classList.remove('visible');
    }
    
    closeAllSidebars() {
        this.closeChannelSidebar();
        this.closeSettingsSidebar();
    }
    
    // Video Overlay Auto-hide
    
    setupOverlayAutoHide() {
        const videoContainer = document.getElementById('videoContainer');
        let hideTimeout = null;
        
        const showControls = () => {
            this.videoOverlay.classList.add('visible');
            
            if (hideTimeout) {
                clearTimeout(hideTimeout);
            }
            
            hideTimeout = setTimeout(() => {
                this.videoOverlay.classList.remove('visible');
            }, 4000);
        };
        
        const hideControls = () => {
            this.videoOverlay.classList.remove('visible');
            if (hideTimeout) {
                clearTimeout(hideTimeout);
            }
        };
        
        // Show on mouse move
        videoContainer.addEventListener('mousemove', showControls);
        
        // Show/hide on touch
        videoContainer.addEventListener('touchstart', (e) => {
            if (this.videoOverlay.classList.contains('visible')) {
                hideControls();
            } else {
                showControls();
            }
        });
        
        // Show on mouse enter
        videoContainer.addEventListener('mouseenter', showControls);
        
        // Hide on mouse leave
        videoContainer.addEventListener('mouseleave', () => {
            setTimeout(hideControls, 1000);
        });
        
        // Show initially
        showControls();
    }
    
    // Channel Info Display
    
    updateChannelInfo(channel, channelNumber = '') {
        if (channel) {
            this.channelName.textContent = channel.name || 'Unknown Channel';
            this.channelNumber.textContent = channelNumber ? `Channel ${channelNumber}` : '';
        } else {
            this.channelName.textContent = 'No Channel Selected';
            this.channelNumber.textContent = '';
        }
    }
    
    // Render Channels
    
    renderChannels(channels, currentIndex) {
        console.log('Rendering channels:', channels.length);
        this.channelList.innerHTML = '';
        
        channels.forEach((channel, index) => {
            const li = document.createElement('li');
            li.className = 'channel-item';
            li.tabIndex = 0;
            
            if (index === currentIndex) {
                li.classList.add('active');
            }
            
            li.innerHTML = `
                <div class="channel-item-number">${index + 1}</div>
                <div class="channel-item-name">${this.escapeHtml(channel.name)}</div>
            `;
            
            // Click to play
            li.addEventListener('click', () => {
                window.app.playChannel(index);
            });
            
            // Keyboard navigation
            li.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    window.app.playChannel(index);
                }
            });
            
            this.channelList.appendChild(li);
        });
        
        console.log('Channels rendered successfully');
    }
    
    highlightCurrentChannel(index) {
        const items = this.channelList.querySelectorAll('.channel-item');
        items.forEach((item, i) => {
            if (i === index) {
                item.classList.add('active');
                item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            } else {
                item.classList.remove('active');
            }
        });
    }
    
    // Render Playlists
    
    renderPlaylists(playlists, currentPlaylistId) {
        if (playlists.length === 0) {
            this.playlistList.innerHTML = '<p class="text-muted">No playlists saved yet</p>';
            return;
        }
        
        this.playlistList.innerHTML = '';
        
        playlists.forEach(playlist => {
            const div = document.createElement('div');
            div.className = 'playlist-item';
            
            if (playlist.id === currentPlaylistId) {
                div.classList.add('active');
            }
            
            div.innerHTML = `
                <div class="playlist-item-info">
                    <div class="playlist-item-name">${this.escapeHtml(playlist.name)}</div>
                    <div class="playlist-item-count">${playlist.channels.length} channels</div>
                </div>
                <div class="playlist-item-actions">
                    <button class="btn-icon btn-load" data-id="${playlist.id}" aria-label="Load playlist">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polygon points="5 3 19 12 5 21 5 3"/>
                        </svg>
                    </button>
                    <button class="btn-icon btn-delete" data-id="${playlist.id}" aria-label="Delete playlist">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        </svg>
                    </button>
                </div>
            `;
            
            // Load button
            const btnLoad = div.querySelector('.btn-load');
            btnLoad.addEventListener('click', () => {
                window.app.loadPlaylist(playlist.id);
            });
            
            // Delete button
            const btnDelete = div.querySelector('.btn-delete');
            btnDelete.addEventListener('click', (e) => {
                e.stopPropagation();
                window.app.deletePlaylist(playlist.id);
            });
            
            this.playlistList.appendChild(div);
        });
    }
    
    // Loading States
    
    showLoading(message = 'Loading...') {
        this.loadingIndicator.style.display = 'block';
        const loadingText = this.loadingIndicator.querySelector('p');
        if (loadingText) {
            loadingText.textContent = message;
        }
    }
    
    hideLoading() {
        this.loadingIndicator.style.display = 'none';
    }
    
    // Welcome Screen
    
    showWelcomeScreen() {
        this.welcomeScreen.style.display = 'flex';
    }
    
    hideWelcomeScreen() {
        this.welcomeScreen.style.display = 'none';
    }
    
    // Utility
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}