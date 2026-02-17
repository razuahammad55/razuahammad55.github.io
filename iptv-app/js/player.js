/**
 * Universal Video Player
 * Works with HTTP and HTTPS (Service Worker handles proxy)
 */

class VideoPlayer {
    constructor() {
        this.video = document.getElementById('videoPlayer');
        this.hls = null;
        this.currentChannel = null;
        this.retryCount = 0;
        this.maxRetries = 2;
        
        this.disableLoadingIndicators();
        this.setupVideoEvents();
        console.log('✓ Universal Player initialized');
    }
    
    disableLoadingIndicators() {
        const loading = document.getElementById('loadingIndicator');
        if (loading) {
            loading.style.display = 'none';
            loading.remove();
        }
    }
    
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
            fragLoadingTimeOut: 15000,
            manifestLoadingTimeOut: 10000,
            levelLoadingTimeOut: 10000,
            fragLoadingMaxRetry: 3,
            manifestLoadingMaxRetry: 3,
            levelLoadingMaxRetry: 3,
            fragLoadingRetryDelay: 1000,
            manifestLoadingRetryDelay: 1000,
            levelLoadingRetryDelay: 1000,
            nudgeMaxRetry: 1,
            maxFragLookUpTolerance: 0.1,
            highBufferWatchdogPeriod: 1,
            debug: false,
            xhrSetup: (xhr, url) => {
                xhr.withCredentials = false;
            }
        };
    }
    
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
        
        const url = channel.url.trim();
        
        // Service Worker will handle HTTP->HTTPS proxy automatically
        // Just play the stream normally
        
        if (url.includes('.m3u8') || url.includes('m3u8')) {
            this.playHLS(url);
        } else if (url.includes('.mpd')) {
            this.playDirect(url);
        } else if (url.startsWith('rtmp://') || url.startsWith('rtmps://')) {
            this.playRTMP(url);
        } else if (url.includes('.mp4') || url.includes('.webm') || url.includes('.mkv')) {
            this.playDirect(url);
        } else {
            this.playHTTP(url);
        }
    }
    
    playHLS(url) {
        if (Hls.isSupported()) {
            console.log('📡 HLS stream:', url);
            
            this.hls = new Hls(this.getUltraFastHLSConfig());
            this.hls.loadSource(url);
            this.hls.attachMedia(this.video);
            
            this.hls.on(Hls.Events.MANIFEST_PARSED, () => {
                console.log('✅ Manifest parsed');
                this.video.play().catch(e => console.log('Autoplay blocked'));
            });
            
            this.hls.on(Hls.Events.ERROR, (event, data) => {
                if (data.fatal) {
                    console.warn('HLS error:', data.type, data.details);
                    
                    if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
                        if (this.retryCount < this.maxRetries) {
                            this.retryCount++;
                            console.log(`🔄 Retry ${this.retryCount}/${this.maxRetries}`);
                            setTimeout(() => this.hls.startLoad(), 1000);
                        } else {
                            this.skipToNext();
                        }
                    } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
                        console.log('🔄 Media error, recovering...');
                        this.hls.recoverMediaError();
                    } else {
                        this.skipToNext();
                    }
                }
            });
            
        } else if (this.video.canPlayType('application/vnd.apple.mpegurl')) {
            console.log('📡 Native HLS');
            this.video.src = url;
            this.video.play().catch(e => console.log('Autoplay blocked'));
        } else {
            console.warn('HLS not supported');
            this.playDirect(url);
        }
    }
    
    playHTTP(url) {
        console.log('📡 HTTP stream');
        
        if (Hls.isSupported()) {
            this.hls = new Hls(this.getUltraFastHLSConfig());
            this.hls.loadSource(url);
            this.hls.attachMedia(this.video);
            
            this.hls.on(Hls.Events.MANIFEST_PARSED, () => {
                console.log('✓ Detected as HLS');
                this.video.play().catch(e => console.log('Autoplay blocked'));
            });
            
            this.hls.on(Hls.Events.ERROR, (event, data) => {
                if (data.fatal && data.type === Hls.ErrorTypes.NETWORK_ERROR) {
                    console.log('Not HLS, trying direct');
                    this.cleanup();
                    this.playDirect(url);
                }
            });
        } else {
            this.playDirect(url);
        }
    }
    
    playRTMP(url) {
        console.log('📡 RTMP stream');
        const httpUrl = url.replace('rtmp://', 'http://').replace('rtmps://', 'https://');
        this.playDirect(httpUrl);
    }
    
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
    
    skipToNext() {
        console.log('⏭️ Skipping to next channel...');
        setTimeout(() => {
            if (window.app) {
                window.app.playNextChannel();
            }
        }, 1500);
    }
    
    cleanup() {
        this.video.pause();
        this.video.removeAttribute('src');
        this.video.load();
        
        if (this.hls) {
            this.hls.destroy();
            this.hls = null;
        }
    }
    
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
            console.error('❌ Video error:', this.video.error);
            if (this.retryCount < this.maxRetries) {
                this.retryCount++;
                console.log(`🔄 Retry ${this.retryCount}/${this.maxRetries}`);
                setTimeout(() => {
                    if (this.currentChannel) {
                        this.playChannel(this.currentChannel);
                    }
                }, 1500);
            } else {
                this.skipToNext();
            }
        });
        
        this.video.addEventListener('stalled', () => {
            console.warn('⚠️ Stalled, recovering...');
            setTimeout(() => {
                this.video.load();
                this.video.play().catch(() => {});
            }, 1000);
        });
        
        this.video.addEventListener('ended', () => {
            console.log('✓ Stream ended');
            this.skipToNext();
        });
    }
    
    togglePlayPause() {
        if (this.video.paused) {
            this.video.play();
        } else {
            this.video.pause();
        }
    }
    
    stop() {
        this.cleanup();
        console.log('⏹️ Stopped');
    }
}
