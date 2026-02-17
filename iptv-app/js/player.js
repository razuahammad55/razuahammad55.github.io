/**
 * Universal Video Player
 * Supports ALL formats with HTTP/HTTPS proxy
 */

class VideoPlayer {
    constructor() {
        this.video = document.getElementById('videoPlayer');
        this.hls = null;
        this.currentChannel = null;
        this.retryCount = 0;
        this.maxRetries = 2;
        
        // CORS Proxy for HTTP streams
        this.corsProxies = [
            'https://corsproxy.io/?',
            'https://api.allorigins.win/raw?url=',
            'https://cors.eu.org/',
        ];
        this.currentProxyIndex = 0;
        
        this.disableLoadingIndicators();
        this.setupVideoEvents();
        console.log('✓ Universal Player with HTTP Proxy support');
    }
    
    /**
     * Check if we need proxy (HTTP stream on HTTPS page)
     */
    needsProxy(url) {
        const pageIsHTTPS = window.location.protocol === 'https:';
        const urlIsHTTP = url.startsWith('http://');
        return pageIsHTTPS && urlIsHTTP;
    }
    
    /**
     * Apply proxy to URL
     */
    applyProxy(url) {
        const proxy = this.corsProxies[this.currentProxyIndex];
        console.log(`🔀 Using proxy ${this.currentProxyIndex + 1}:`, proxy);
        return proxy + encodeURIComponent(url);
    }
    
    /**
     * Try next proxy
     */
    tryNextProxy(originalUrl) {
        this.currentProxyIndex++;
        if (this.currentProxyIndex < this.corsProxies.length) {
            console.log('🔄 Trying next proxy...');
            this.playChannel(this.currentChannel);
        } else {
            console.error('❌ All proxies failed');
            this.currentProxyIndex = 0;
            this.skipToNext();
        }
    }
    
    /**
     * Disable loading indicators
     */
    disableLoadingIndicators() {
        const loading = document.getElementById('loadingIndicator');
        if (loading) {
            loading.style.display = 'none';
            loading.remove();
        }
    }
    
    /**
     * Ultra-fast HLS config
     */
    getUltraFastHLSConfig() {
        return {
            maxBufferLength: 3,
            maxMaxBufferLength: 5,
            maxBufferSize: 10 * 1000 * 1000,
            maxBufferHole: 0.1,
            liveSyncDurationCount: 1,
            liveMaxLatencyDurationCount: 3,
            liveDurationInfinity: false,
            enableWorker: true,
            lowLatencyMode: true,
            backBufferLength: 0,
            startLevel: -1,
            autoStartLoad: true,
            testBandwidth: false,
            abrEwmaDefaultEstimate: 10000000,
            fragLoadingTimeOut: 10000,
            manifestLoadingTimeOut: 5000,
            levelLoadingTimeOut: 5000,
            fragLoadingMaxRetry: 2,
            manifestLoadingMaxRetry: 2,
            levelLoadingMaxRetry: 2,
            fragLoadingRetryDelay: 500,
            manifestLoadingRetryDelay: 500,
            levelLoadingRetryDelay: 500,
            nudgeMaxRetry: 1,
            maxFragLookUpTolerance: 0.1,
            highBufferWatchdogPeriod: 1,
            debug: false,
            // CORS settings
            xhrSetup: (xhr, url) => {
                xhr.withCredentials = false;
            }
        };
    }
    
    /**
     * Play channel - INSTANT
     */
    playChannel(channel) {
        if (!channel || !channel.url) {
            console.warn('Invalid channel');
            this.skipToNext();
            return;
        }
        
        console.log('⚡ Playing:', channel.name);
        this.currentChannel = channel;
        this.retryCount = 0;
        
        this.cleanup();
        
        let url = channel.url.trim();
        
        // Apply proxy if needed
        if (this.needsProxy(url)) {
            console.log('🔒 HTTP stream on HTTPS page - applying proxy');
            url = this.applyProxy(url);
        }
        
        // Detect format and play
        if (url.includes('.m3u8') || url.includes('m3u8')) {
            this.playHLS(url, channel.url);
        } else if (url.includes('.mpd')) {
            this.playDASH(url);
        } else if (url.startsWith('rtmp://') || url.startsWith('rtmps://')) {
            this.playRTMP(url);
        } else if (url.includes('.mp4') || url.includes('.webm') || url.includes('.mkv')) {
            this.playDirect(url);
        } else {
            this.playHTTP(url, channel.url);
        }
    }
    
    /**
     * Play HLS stream
     */
    playHLS(url, originalUrl) {
        if (Hls.isSupported()) {
            console.log('📡 HLS stream');
            
            this.hls = new Hls(this.getUltraFastHLSConfig());
            this.hls.loadSource(url);
            this.hls.attachMedia(this.video);
            
            this.hls.on(Hls.Events.MANIFEST_PARSED, () => {
                console.log('✅ Manifest loaded');
                this.currentProxyIndex = 0; // Reset proxy on success
                this.video.play().catch(e => console.log('Autoplay blocked:', e));
            });
            
            this.hls.on(Hls.Events.ERROR, (event, data) => {
                if (data.fatal) {
                    console.warn('HLS error:', data.details);
                    
                    if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
                        // If using proxy and failed, try next proxy
                        if (this.needsProxy(originalUrl)) {
                            this.tryNextProxy(originalUrl);
                        } else if (this.retryCount < 1) {
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
            console.log('📡 Native HLS');
            this.video.src = url;
            this.video.play().catch(e => console.log('Autoplay blocked:', e));
        } else {
            this.playDirect(url);
        }
    }
    
    /**
     * Play DASH stream
     */
    playDASH(url) {
        console.log('📡 DASH stream');
        this.playDirect(url);
    }
    
    /**
     * Play RTMP stream
     */
    playRTMP(url) {
        console.log('📡 RTMP stream');
        const httpUrl = url.replace('rtmp://', 'http://').replace('rtmps://', 'https://');
        this.playDirect(httpUrl);
    }
    
    /**
     * Play HTTP stream
     */
    playHTTP(url, originalUrl) {
        console.log('📡 HTTP stream');
        
        if (Hls.isSupported()) {
            this.hls = new Hls(this.getUltraFastHLSConfig());
            this.hls.loadSource(url);
            this.hls.attachMedia(this.video);
            
            this.hls.on(Hls.Events.MANIFEST_PARSED, () => {
                console.log('✓ Detected as HLS');
                this.currentProxyIndex = 0;
                this.video.play().catch(e => console.log('Autoplay blocked:', e));
            });
            
            this.hls.on(Hls.Events.ERROR, (event, data) => {
                if (data.fatal) {
                    if (this.needsProxy(originalUrl)) {
                        this.tryNextProxy(originalUrl);
                    } else {
                        this.cleanup();
                        this.playDirect(url);
                    }
                }
            });
        } else {
            this.playDirect(url);
        }
    }
    
    /**
     * Play direct stream
     */
    playDirect(url) {
        console.log('📡 Direct stream');
        
        this.video.src = url;
        this.video.play().catch(e => {
            console.log('Play error:', e);
            setTimeout(() => {
                this.video.play().catch(() => this.skipToNext());
            }, 500);
        });
    }
    
    /**
     * Skip to next channel
     */
    skipToNext() {
        console.log('⏭️ Skipping...');
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
        this.video.pause();
        this.video.removeAttribute('src');
        this.video.load();
        
        if (this.hls) {
            this.hls.destroy();
            this.hls = null;
        }
    }
    
    /**
     * Setup video events
     */
    setupVideoEvents() {
        this.video.addEventListener('playing', () => {
            console.log('▶️ Playing');
        });
        
        this.video.addEventListener('waiting', () => {
            console.log('⏳ Buffering');
        });
        
        this.video.addEventListener('canplay', () => {
            console.log('✓ Ready');
        });
        
        this.video.addEventListener('error', (e) => {
            console.error('Video error');
            if (this.retryCount < this.maxRetries) {
                this.retryCount++;
                console.log(`🔄 Retry ${this.retryCount}`);
                setTimeout(() => {
                    if (this.currentChannel) {
                        this.playChannel(this.currentChannel);
                    }
                }, 1000);
            } else {
                this.skipToNext();
            }
        });
        
        this.video.addEventListener('stalled', () => {
            console.warn('⚠️ Stalled');
            this.video.load();
            this.video.play().catch(() => {});
        });
        
        this.video.addEventListener('ended', () => {
            console.log('✓ Ended');
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
