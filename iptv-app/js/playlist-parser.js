/**
 * M3U/M3U8 Playlist Parser
 * Parses M3U and M3U8 playlist formats
 */

class PlaylistParser {
    constructor() {
        console.log('PlaylistParser initialized');
    }
    
    /**
     * Parse M3U/M3U8 content
     * @param {string} content - Raw M3U content
     * @returns {Array} Array of channel objects
     */
    parse(content) {
        const channels = [];
        const lines = content.split('\n').map(line => line.trim()).filter(line => line);
        
        let currentChannel = null;
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            
            // Check if it's an EXTINF line (channel info)
            if (line.startsWith('#EXTINF')) {
                currentChannel = this.parseExtInf(line);
            }
            // Check if it's a URL (stream URL)
            else if (line.startsWith('http://') || line.startsWith('https://') || line.startsWith('rtmp://')) {
                if (currentChannel) {
                    currentChannel.url = line;
                    channels.push(currentChannel);
                    currentChannel = null;
                } else {
                    // URL without EXTINF, create basic channel
                    channels.push({
                        name: this.getNameFromUrl(line),
                        url: line,
                        logo: null,
                        group: null
                    });
                }
            }
        }
        
        console.log(`Parsed ${channels.length} channels`);
        return channels;
    }
    
    /**
     * Parse EXTINF line
     * Format: #EXTINF:-1 tvg-id="..." tvg-name="..." tvg-logo="..." group-title="...",Channel Name
     */
    parseExtInf(line) {
        const channel = {
            name: '',
            url: '',
            logo: null,
            group: null
        };
        
        // Extract channel name (after last comma)
        const commaIndex = line.lastIndexOf(',');
        if (commaIndex !== -1) {
            channel.name = line.substring(commaIndex + 1).trim();
        }
        
        // Extract tvg-logo
        const logoMatch = line.match(/tvg-logo="([^"]*)"/i);
        if (logoMatch) {
            channel.logo = logoMatch[1];
        }
        
        // Extract group-title
        const groupMatch = line.match(/group-title="([^"]*)"/i);
        if (groupMatch) {
            channel.group = groupMatch[1];
        }
        
        // Extract tvg-name if channel name is empty
        if (!channel.name) {
            const nameMatch = line.match(/tvg-name="([^"]*)"/i);
            if (nameMatch) {
                channel.name = nameMatch[1];
            }
        }
        
        // Fallback to "Unknown Channel"
        if (!channel.name) {
            channel.name = 'Unknown Channel';
        }
        
        return channel;
    }
    
    /**
     * Extract name from URL as fallback
     */
    getNameFromUrl(url) {
        try {
            const urlObj = new URL(url);
            const pathname = urlObj.pathname;
            const filename = pathname.split('/').pop();
            return filename || 'Unknown Channel';
        } catch (e) {
            return 'Unknown Channel';
        }
    }
    
    /**
     * Validate M3U content
     */
    isValidM3U(content) {
        return content.includes('#EXTM3U') || content.includes('http://') || content.includes('https://');
    }
}