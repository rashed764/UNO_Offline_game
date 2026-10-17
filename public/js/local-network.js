/**
 * Local Network & P2P Hotspot Connection Controller (`public/js/local-network.js`)
 * Manages direct device-to-device communication over mobile hotspot / local Wi-Fi.
 */

class LocalNetworkManager {
  constructor() {
    this.isHost = false;
    this.roomId = null;
    this.peers = new Map();
    this.dataChannel = null;
    this.peerConnection = null;
    this.localIp = window.location.hostname || 'localhost';
    this.port = window.location.port || '3000';
  }

  /**
   * Initialize Host local network node & generate connection payload for QR code.
   */
  initHost(roomId) {
    this.isHost = true;
    this.roomId = roomId;
    const protocol = window.location.protocol;
    const hostUrl = `${protocol}//${this.localIp}:${this.port}/?room=${roomId}`;
    const payload = JSON.stringify({
      roomId: roomId,
      ip: this.localIp,
      port: this.port,
      url: hostUrl
    });

    console.log('[LocalNetwork] Host initialized for room:', roomId, 'Payload:', payload);
    return { roomId, payload, url: hostUrl };
  }

  /**
   * Parse scanned QR code payload from host and establish connection.
   */
  connectToHost(scannedText, onConnected) {
    this.isHost = false;
    let roomCode = scannedText.trim();
    let targetUrl = null;

    try {
      if (scannedText.startsWith('{') && scannedText.endsWith('}')) {
        const data = JSON.parse(scannedText);
        roomCode = data.roomId;
        targetUrl = data.url;
      } else if (scannedText.includes('room=')) {
        const urlParams = new URLSearchParams(scannedText.split('?')[1]);
        roomCode = urlParams.get('room') || roomCode;
        targetUrl = scannedText;
      }
    } catch (e) {
      console.warn('[LocalNetwork] Scanned text is plain room code:', scannedText);
    }

    console.log('[LocalNetwork] Connecting to host room:', roomCode, 'Target URL:', targetUrl);
    this.roomId = roomCode;

    if (typeof onConnected === 'function') {
      onConnected(roomCode, targetUrl);
    }

    return roomCode;
  }

  /**
   * Broadcast game events over local connection.
   */
  broadcast(event, data) {
    if (this.dataChannel && this.dataChannel.readyState === 'open') {
      this.dataChannel.send(JSON.stringify({ event, data }));
    }
  }
}

window.LocalNetwork = new LocalNetworkManager();
