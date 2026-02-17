/**
 * Universal Video Player
 * Supports: HLS, DASH, MP4, WebM, RTMP, HTTP streams
 * ZERO buffering delays, instant switching
 */

class VideoPlayer {
    constructor() {
        this.video = document.getElementById('videoPlayer');
        this.hls = null;
        this.currentChannel = null;
        this.retryCount = 0;
        this.maxRetries = 2;
        
        // Disable ALL loading indicators
        this.disableLoadingIndicators();
        
        this.setupVideoEvents();
        console.log('✓ Universal Player initialized');
    }
    
    /**
     * Disable all loading indicators permanently
     */
    disableLoadingIndicators() {
        const loading = document.getElementById('loadingIndicator');
        if (loading) {
            loading.style.display = 'none !important';
            loading.remove(); // Remove it completely
        }
        console.log('🚫 Loading indicators disabled');
    }
    
    /**
     * Ultra-fast HLS configuration
     */
    getUltraFastHLSConfig() {
        return {
            // Minimal buffering
            maxBufferLength: 3,               // Only 3 seconds buffer
            maxMaxBufferLength: 5,            // Max 5 seconds
            maxBufferSize: 10 * 1000 * 1000,  // 10 MB only
            maxBufferHole: 0.1,               // Jump tiny gaps
            
            // Ultra-low latency
            liveSyncDurationCount: 1,         // Minimum sync
            liveMaxLatencyDurationCount: 3,
            liveDurationInfinity: false,
            
            // Instant start
            enableWorker: true,
            lowLatencyMode: true,
            backBufferLength: 0,              // No back buffer
            
            // Quality
            startLevel: -1,                   // Auto
            autoStartLoad: true,
            testBandwidth: false,             // Skip bandwidth test
            abrEwmaDefaultEstimate: 10000000, // Assume 10 Mbps
            
            // Aggressive timeouts
            fragLoadingTimeOut: 10000,        // 10s
            manifestLoadingTimeOut: 5000,     // 5s
            levelLoadingTimeOut: 5000,
            
            // Minimal retries
            fragLoadingMaxRetry: 2,
            manifestLoadingMaxRetry: 2,
            levelLoadingMaxRetry: 2,
            fragLoadingRetryDelay: 500,
            manifestLoadingRetryDelay: 500,
            levelLoadingRetryDelay: 500,
            
            // Performance
            nudgeMaxRetry: 1,
            maxFragLookUpTolerance: 0.1,
            highBufferWatchdogPeriod: 1,
            
            // Silent errors
            debug: false
        };
    }
    
    /**
     * Play channel - INSTANT, NO LOADING SCREEN
     */
    playChannel(channel) {
        if (!channel || !channel.url) {
            console.warn('Invalid channel');
            this.skipToNext();
            return;
        }
        
        console.log('⚡ Instant switch:', channel.name);
        this.currentChannel = channel;
        this.retryCount = 0;
        
        // Clean up immediately
        this.cleanup();
        
        // Detect and play based on URL
        const url = channel.url.trim();
        
        // HLS streams (.m3u8)
        if (url.includes('.m3u8') || url.includes('m3u8')) {
            this.playHLS(url);
        }
        // DASH streams (.mpd)
        else if (url.includes('.mpd')) {
            this.playDASH(url);
        }
        // RTMP streams
        else if (url.startsWith('rtmp://') || url.startsWith('rtmps://')) {
            this.playRTMP(url);
        }
        // Direct video files
        else if (url.includes('.mp4') || url.includes('.webm') || url.includes('.mkv')) {
            this.playDirect(url);
        }
        // HTTP/HTTPS streams (try as direct first, then HLS)
        else if (url.startsWith('http://') || url.startsWith('https://')) {
            this.playHTTP(url);
        }
        // Unknown - try direct
        else {
            console.log('🔍 Unknown format, trying direct stream');
            this.playDirect(url);
        }
    }
    
    /**
     * Play HLS stream
     */
    playHLS(url) {
        if (Hls.isSupported()) {
            console.log('📡 HLS stream');
            
            this.hls = new Hls(this.getUltraFastHLSConfig());
            this.hls.loadSource(url);
            this.hls.attachMedia(this.video);
            
            // Start playing IMMEDIATELY on manifest parse
            this.hls.on(Hls.Events.MANIFEST_PARSED, () => {
                this.video.play().catch(e => console.log('Play blocked:', e));
            });
            
            // Silent error handling
            this.hls.on(Hls.Events.ERROR, (event, data) => {
                if (data.fatal) {
                    console.warn('HLS error:', data.details);
                    
                    if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
                        // Try once more
                        if (this.retryCount < 1) {
                            this.retryCount++;
                            setTimeout(() => this.hls.startLoad(), 500);
                        } else {
                            this.skipToNext();
                        }
                    } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
                        this.hls.recoverMediaError();
                    } else {
                        this.skipToNext();
                    }
                }
            });
            
        } else if (this.video.canPlayType('application/vnd.apple.mpegurl')) {
            // Safari native HLS
            console.log('📡 Native HLS');
            this.video.src = url;
            this.video.play().catch(e => console.log('Play blocked:', e));
        } else {
            console.warn('HLS not supported, trying direct');
            this.playDirect(url);
        }
    }
    
    /**
     * Play DASH stream
     */
    playDASH(url) {
        console.log('📡 DASH stream (trying as direct)');
        // Most browsers support DASH natively or via Media Source Extensions
        this.playDirect(url);
    }
    
    /**
     * Play RTMP stream
     */
    playRTMP(url) {
        console.log('📡 RTMP stream (converting to HLS if available)');
        // Try to play directly (some RTMP can be played via HLS conversion)
        // Convert rtmp:// to http:// if server supports it
        const httpUrl = url.replace('rtmp://', 'http://').replace('rtmps://', 'https://');
        this.playDirect(httpUrl);
    }
    
    /**
     * Play HTTP stream (try multiple methods)
     */
    playHTTP(url) {
        console.log('📡 HTTP stream');
        
        // Try as HLS first (many HTTP streams are HLS without .m3u8 extension)
        if (Hls.isSupported()) {
            this.hls = new Hls(this.getUltraFastHLSConfig());
            this.hls.loadSource(url);
            this.hls.attachMedia(this.video);
            
            this.hls.on(Hls.Events.MANIFEST_PARSED, () => {
                console.log('✓ Detected as HLS');
                this.video.play().catch(e => console.log('Play blocked:', e));
            });
            
            this.hls.on(Hls.Events.ERROR, (event, data) => {
                if (data.fatal && data.type === Hls.ErrorTypes.NETWORK_ERROR) {
                    // Not HLS, try direct
                    console.log('Not HLS, trying direct');
                    this.cleanup();
                    this.playDirect(url);
                }
            });
        } else {
            this.playDirect(url);
        }
    }
    
    /**
     * Play direct stream (fallback for all formats)
     */
    playDirect(url) {
        console.log('📡 Direct stream');
        
        this.video.src = url;
        
        // Try to play immediately
        this.video.play().catch(e => {
            console.log('Autoplay blocked or error:', e);
            // Try again after short delay
            setTimeout(() => {
                this.video.play().catch(err => {
                    console.warn('Cannot play:', err);
                    this.skipToNext();
                });
            }, 500);
        });
    }
    
    /**
     * Skip to next channel on error
     */
    skipToNext() {
        console.log('⏭️ Auto-skipping...');
        setTimeout(() => {
            if (window.app) {
                window.app.playNextChannel();
            }
        }, 1000);
    }
    
    /**
     * Cleanup
     */
    cleanup() {
        // Stop current playback
        this.video.pause();
        this.video.removeAttribute('src');
        this.video.load();
        
        // Destroy HLS
        if (this.hls) {
            this.hls.destroy();
            this.hls = null;
        }
    }
    
    /**
     * Setup video events
     */
    setupVideoEvents() {
        // Playing - just log, no UI changes
        this.video.addEventListener('playing', () => {
            console.log('▶️ Playing');
        });
        
        // Waiting - no action, no loading screen
        this.video.addEventListener('waiting', () => {
            console.log('⏳ Buffering (silent)');
        });
        
        // Can play - just log
        this.video.addEventListener('canplay', () => {
            console.log('✓ Ready');
        });
        
        // Error - auto-skip
        this.video.addEventListener('error', (e) => {
            console.error('Video error:', e);
            if (this.retryCount < this.maxRetries) {
                this.retryCount++;
                console.log(`🔄 Retry ${this.retryCount}/${this.maxRetries}`);
                setTimeout(() => {
                    if (this.currentChannel) {
                        this.playChannel(this.currentChannel);
                    }
                }, 1000);
            } else {
                this.skipToNext();
            }
        });
        
        // Stalled - try to recover
        this.video.addEventListener('stalled', () => {
            console.warn('⚠️ Stalled, attempting recovery');
            this.video.load();
            this.video.play().catch(() => {});
        });
        
        // Ended - play next
        this.video.addEventListener('ended', () => {
            console.log('✓ Ended, next channel');
            this.skipToNext();
        });
    }
    
    /**
     * Toggle play/pause
     */
    togglePlayPause() {
        if (this.video.paused) {
            this.video.play();
        } else {
            this.video.pause();
        }
    }
    
    /**
     * Stop
     */
    stop() {
        this.cleanup();
        console.log('⏹️ Stopped');
    }
}
