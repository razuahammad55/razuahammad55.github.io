/**
 * Video Player with HLS Support
 * OPTIMIZED FOR FAST LOADING & MINIMAL BUFFERING
 */

class VideoPlayer {
    constructor() {
        this.video = document.getElementById('videoPlayer');
        this.hls = null;
        this.preloadHls = null; // For preloading next channel
        this.currentChannel = null;
        this.preloadedChannel = null;
        this.isLoading = false;
        
        this.setupVideoEvents();
        console.log('✓ VideoPlayer initialized (Optimized)');
    }
    
    /**
     * Get optimized HLS configuration
     */
    getOptimizedHLSConfig() {
        return {
            // Fast startup
            maxBufferLength: 10,              // Reduced from default 30s
            maxMaxBufferLength: 20,           // Maximum buffer
            maxBufferSize: 60 * 1000 * 1000,  // 60 MB buffer
            maxBufferHole: 0.5,               // Jump small gaps
            
            // Low latency settings
            liveSyncDurationCount: 3,         // Lower latency for live streams
            liveMaxLatencyDurationCount: 10,
            liveDurationInfinity: false,
            
            // Fast loading
            enableWorker: true,               // Use web worker
            lowLatencyMode: true,             // Enable low latency
            backBufferLength: 10,             // Keep less back buffer
            
            // Quality & performance
            startLevel: -1,                   // Auto quality
            autoStartLoad: true,              // Start loading immediately
            testBandwidth: true,              // Test bandwidth
            abrEwmaDefaultEstimate: 5000000,  // Start with decent quality (5 Mbps)
            abrEwmaFastLive: 3.0,
            abrEwmaSlowLive: 9.0,
            abrBandWidthFactor: 0.95,
            abrBandWidthUpFactor: 0.7,
            
            // Fragment loading
            fragLoadingTimeOut: 20000,        // 20s timeout
            manifestLoadingTimeOut: 10000,    // 10s timeout
            levelLoadingTimeOut: 10000,
            
            // Error recovery
            fragLoadingMaxRetry: 3,
            manifestLoadingMaxRetry: 3,
            levelLoadingMaxRetry: 3,
            fragLoadingRetryDelay: 1000,
            manifestLoadingRetryDelay: 1000,
            levelLoadingRetryDelay: 1000,
            
            // Faster seeking
            nudgeMaxRetry: 3,
            maxFragLookUpTolerance: 0.25,
            
            // Stall detection
            highBufferWatchdogPeriod: 2,
            
            // Debug (set to false in production)
            debug: false
        };
    }
    
    /**
     * Play a channel with optimized loading
     */
    playChannel(channel) {
        if (!channel || !channel.url) {
            console.error('Invalid channel');
            return;
        }
        
        console.log('🎬 Loading channel:', channel.name);
        this.currentChannel = channel;
        this.isLoading = true;
        
        // Show loading state
        this.showLoading();
        
        // Clean up existing HLS
        if (this.hls) {
            this.hls.destroy();
            this.hls = null;
        }
        
        const url = channel.url;
        
        // Check if it's an HLS stream
        if (url.includes('.m3u8')) {
            this.playHLSStream(url);
        } else {
            // Direct stream (non-HLS)
            this.playDirectStream(url);
        }
        
        // Preload next channel after 2 seconds
        setTimeout(() => {
            this.preloadNextChannel();
        }, 2000);
    }
    
    /**
     * Play HLS stream with optimization
     */
    playHLSStream(url) {
        if (Hls.isSupported()) {
            console.log('📡 Using HLS.js (optimized)');
            
            // Create HLS instance with optimized config
            this.hls = new Hls(this.getOptimizedHLSConfig());
            
            // Load source
            this.hls.loadSource(url);
            this.hls.attachMedia(this.video);
            
            // Events
            this.hls.on(Hls.Events.MANIFEST_PARSED, () => {
                console.log('✓ Manifest parsed, starting playback');
                
                // Set quality (start with best quality available)
                if (this.hls.levels.length > 0) {
                    // Auto quality selection
                    this.hls.currentLevel = -1; // Auto
                    console.log('📊 Quality levels:', this.hls.levels.length);
                }
                
                // Play immediately
                this.video.play()
                    .then(() => {
                        console.log('▶️ Playing');
                        this.isLoading = false;
                        this.hideLoading();
                    })
                    .catch(err => {
                        console.error('Play error:', err);
                        this.isLoading = false;
                        this.hideLoading();
                    });
            });
            
            // Level switching (quality change)
            this.hls.on(Hls.Events.LEVEL_SWITCHING, (event, data) => {
                console.log('🔄 Switching to quality level:', data.level);
            });
            
            this.hls.on(Hls.Events.LEVEL_SWITCHED, (event, data) => {
                const level = this.hls.levels[data.level];
                console.log(`✓ Quality: ${level.height}p @ ${Math.round(level.bitrate / 1000)}kbps`);
            });
            
            // Fragment loading
            this.hls.on(Hls.Events.FRAG_LOADED, (event, data) => {
                // Fragment loaded successfully - hide loading if showing
                if (this.isLoading) {
                    this.isLoading = false;
                    this.hideLoading();
                }
            });
            
            // Error handling with auto-recovery
            this.hls.on(Hls.Events.ERROR, (event, data) => {
                console.warn('HLS Error:', data.type, data.details);
                
                if (data.fatal) {
                    switch (data.type) {
                        case Hls.ErrorTypes.NETWORK_ERROR:
                            console.log('🔄 Network error, attempting recovery...');
                            this.hls.startLoad();
                            break;
                            
                        case Hls.ErrorTypes.MEDIA_ERROR:
                            console.log('🔄 Media error, attempting recovery...');
                            this.hls.recoverMediaError();
                            break;
                            
                        default:
                            console.error('❌ Fatal error, cannot recover');
                            this.hideLoading();
                            // Try next channel after 3 seconds
                            setTimeout(() => {
                                if (window.app) {
                                    window.app.playNextChannel();
                                }
                            }, 3000);
                            break;
                    }
                }
            });
            
        } else if (this.video.canPlayType('application/vnd.apple.mpegurl')) {
            // Native HLS support (Safari)
            console.log('📡 Using native HLS');
            this.video.src = url;
            this.video.play()
                .then(() => {
                    this.isLoading = false;
                    this.hideLoading();
                })
                .catch(err => {
                    console.error('Play error:', err);
                    this.hideLoading();
                });
        } else {
            console.error('HLS not supported');
            this.hideLoading();
        }
    }
    
    /**
     * Play direct stream (non-HLS)
     */
    playDirectStream(url) {
        console.log('📡 Direct stream');
        this.video.src = url;
        this.video.play()
            .then(() => {
                this.isLoading = false;
                this.hideLoading();
            })
            .catch(err => {
                console.error('Play error:', err);
                this.hideLoading();
            });
    }
    
    /**
     * Preload next channel in background
     */
    preloadNextChannel() {
        if (!window.app || !window.app.channels) return;
        
        const currentIndex = window.app.currentChannelIndex;
        const nextIndex = (currentIndex + 1) % window.app.channels.length;
        const nextChannel = window.app.channels[nextIndex];
        
        if (!nextChannel || !nextChannel.url) return;
        
        console.log('🔮 Preloading next channel:', nextChannel.name);
        
        // Only preload HLS streams
        if (nextChannel.url.includes('.m3u8') && Hls.isSupported()) {
            // Clean up previous preload
            if (this.preloadHls) {
                this.preloadHls.destroy();
            }
            
            // Create preload HLS instance
            this.preloadHls = new Hls({
                ...this.getOptimizedHLSConfig(),
                autoStartLoad: false, // Don't start loading yet
                debug: false
            });
            
            this.preloadHls.loadSource(nextChannel.url);
            
            // Just parse manifest, don't load fragments yet
            this.preloadHls.on(Hls.Events.MANIFEST_PARSED, () => {
                console.log('✓ Next channel manifest preloaded');
                this.preloadedChannel = nextChannel;
            });
            
            this.preloadHls.on(Hls.Events.ERROR, () => {
                // Silent fail for preload
                if (this.preloadHls) {
                    this.preloadHls.destroy();
                    this.preloadHls = null;
                }
            });
        }
    }
    
    /**
     * Show loading indicator
     */
    showLoading() {
        const loading = document.getElementById('loadingIndicator');
        if (loading) {
            loading.style.display = 'block';
            const text = loading.querySelector('p');
            if (text) text.textContent = 'Loading channel...';
        }
    }
    
    /**
     * Hide loading indicator
     */
    hideLoading() {
        const loading = document.getElementById('loadingIndicator');
        if (loading) {
            loading.style.display = 'none';
        }
    }
    
    /**
     * Setup video element events
     */
    setupVideoEvents() {
        // Playing
        this.video.addEventListener('playing', () => {
            console.log('▶️ Video playing');
            this.hideLoading();
        });
        
        // Waiting (buffering)
        this.video.addEventListener('waiting', () => {
            console.log('⏳ Buffering...');
            this.showLoading();
        });
        
        // Can play
        this.video.addEventListener('canplay', () => {
            console.log('✓ Can play');
            this.hideLoading();
        });
        
        // Error
        this.video.addEventListener('error', (e) => {
            console.error('Video error:', e);
            this.hideLoading();
            
            // Auto-skip to next channel on error
            setTimeout(() => {
                if (window.app) {
                    console.log('⏭️ Skipping to next channel due to error');
                    window.app.playNextChannel();
                }
            }, 3000);
        });
        
        // Stalled
        this.video.addEventListener('stalled', () => {
            console.warn('⚠️ Stream stalled');
        });
    }
    
    /**
     * Toggle play/pause
     */
    togglePlayPause() {
        if (this.video.paused) {
            this.video.play();
            console.log('▶️ Resumed');
        } else {
            this.video.pause();
            console.log('⏸️ Paused');
        }
    }
    
    /**
     * Stop playback
     */
    stop() {
        this.video.pause();
        this.video.src = '';
        
        if (this.hls) {
            this.hls.destroy();
            this.hls = null;
        }
        
        if (this.preloadHls) {
            this.preloadHls.destroy();
            this.preloadHls = null;
        }
        
        console.log('⏹️ Stopped');
    }
    
    /**
     * Set quality level (0 = auto, 1-N = specific quality)
     */
    setQuality(level) {
        if (this.hls) {
            this.hls.currentLevel = level;
            console.log('📊 Quality set to:', level === -1 ? 'AUTO' : level);
        }
    }
    
    /**
     * Get available quality levels
     */
    getQualityLevels() {
        if (this.hls && this.hls.levels) {
            return this.hls.levels.map((level, index) => ({
                index: index,
                height: level.height,
                bitrate: level.bitrate,
                name: `${level.height}p (${Math.round(level.bitrate / 1000)}kbps)`
            }));
        }
        return [];
    }
}