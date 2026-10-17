/**
 * Frontend Interaction Handlers & Color Picker Controller (3D Perspective Edition)
 */
function initApp() {
  const appState = window.appState;
  const nameInput = document.getElementById('player-name');
  const btnVsAi = document.getElementById('btn-vs-ai');
  const btnCreateRoom = document.getElementById('btn-create-room');
  const btnShowJoin = document.getElementById('btn-show-join');
  const joinBox = document.getElementById('join-box');
  const btnJoinRoom = document.getElementById('btn-join-room');
  const roomCodeInput = document.getElementById('room-code-input');
  const btnStartGame = document.getElementById('btn-start-game');
  const btnLeaveLobby = document.getElementById('btn-leave-lobby');
  const drawDeck3d = document.getElementById('draw-deck-3d');
  const btnUno = document.getElementById('btn-uno');
  const btnExitGame = document.getElementById('btn-exit-game');
  
  // Game Over Modal Buttons
  const btnRestart = document.getElementById('btn-restart');
  const btnHome = document.getElementById('btn-home');

  console.log('⚡ UNO App Initialized, Binding Listeners...');

  // Play vs Computer AI
  if (btnVsAi) {
    btnVsAi.addEventListener('click', () => {
      const name = nameInput.value.trim() || 'Player 1';
      appState.playerName = name;
      const isOfflineMode = (typeof io === 'undefined' || !socket || !socket.connected);
      if (isOfflineMode && typeof initLocalAiGame === 'function') {
        initLocalAiGame(name);
      } else {
        socket.emit('create_room', { playerName: name, mode: 'ai' });
      }
    });
  }

  // Host Local Wi-Fi Game
  if (btnCreateRoom) {
    btnCreateRoom.addEventListener('click', () => {
      const name = nameInput.value.trim() || 'Player 1';
      appState.playerName = name;
      const isOfflineMode = (typeof io === 'undefined' || !socket || !socket.connected);
      if (isOfflineMode) {
        const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
        appState.roomId = roomId;
        appState.isHost = true;
        appState.mode = 'lan';
        const codeEl = document.getElementById('lobby-room-code');
        if (codeEl) codeEl.textContent = roomId;
        const qrContainer = document.getElementById('host-qr-container');
        if (qrContainer && typeof generateQRCode === 'function') {
          const netInfo = window.LocalNetwork ? window.LocalNetwork.initHost(roomId) : { payload: roomId };
          generateQRCode('host-qr-container', netInfo.payload || roomId);
        }
        updatePlayersLobbyList([{ id: socket.id || 'host', name: name, isHost: true }]);
        const startBtn = document.getElementById('btn-start-game');
        if (startBtn) startBtn.classList.remove('hidden');
        if (window.showScreen) window.showScreen('lobby-screen');
      } else {
        socket.emit('create_room', { playerName: name, mode: 'lan' });
      }
    });
  }

  // Show Join Input Box Toggle
  if (btnShowJoin) {
    btnShowJoin.addEventListener('click', () => {
      joinBox.classList.toggle('hidden');
    });
  }

  // Scan QR to Join Button
  const btnShowQrScanner = document.getElementById('btn-show-qr-scanner');
  const qrScannerModal = document.getElementById('qr-scanner-modal');
  const btnScannerClose = document.getElementById('btn-scanner-close');
  const btnScannerCancel = document.getElementById('btn-scanner-cancel');

  if (btnShowQrScanner && qrScannerModal) {
    btnShowQrScanner.addEventListener('click', () => {
      qrScannerModal.classList.remove('hidden');
      if (typeof startQrScanner === 'function') {
        startQrScanner('qr-reader', (decodedText) => {
          qrScannerModal.classList.add('hidden');
          let roomCode = decodedText.trim();
          if (window.LocalNetwork) {
            roomCode = window.LocalNetwork.connectToHost(decodedText, (code) => {
              roomCode = code;
            });
          }
          if (roomCode.includes(':')) {
            const parts = roomCode.split(':');
            roomCode = parts[parts.length - 1].trim();
          }
          const roomCodeInput = document.getElementById('room-code-input');
          const joinBox = document.getElementById('join-box');
          if (roomCodeInput) roomCodeInput.value = roomCode;
          if (joinBox) joinBox.classList.remove('hidden');
          showToast(`📷 Scanned Room Code: ${roomCode}`);

          const name = nameInput.value.trim() || 'Player 1';
          appState.playerName = name;
          socket.emit('join_room', { roomId: roomCode, playerName: name });
        });
      }
    });
  }

  if (btnScannerClose) {
    btnScannerClose.addEventListener('click', () => {
      qrScannerModal.classList.add('hidden');
      if (typeof stopQrScanner === 'function') stopQrScanner();
    });
  }

  if (btnScannerCancel) {
    btnScannerCancel.addEventListener('click', () => {
      qrScannerModal.classList.add('hidden');
      if (typeof stopQrScanner === 'function') stopQrScanner();
    });
  }

  // Join Room Button
  if (btnJoinRoom) {
    btnJoinRoom.addEventListener('click', () => {
      const name = nameInput.value.trim() || 'Player 1';
      const roomCode = roomCodeInput.value.trim();

      if (!roomCode) {
        showToast('⚠️ Please enter a 6-character room code!');
        return;
      }

      appState.playerName = name;
      socket.emit('join_room', { roomId: roomCode, playerName: name });
    });
  }

  // Start Game Button
  if (btnStartGame) {
    btnStartGame.addEventListener('click', () => {
      const isOfflineMode = (typeof io === 'undefined' || !socket || !socket.connected);
      if (isOfflineMode && appState.roomId) {
        if (typeof initLocalAiGame === 'function') {
          initLocalAiGame(appState.playerName || 'Player 1');
        }
      } else if (appState.roomId) {
        socket.emit('start_game', { roomId: appState.roomId });
      }
    });
  }

  // Leave Lobby
  if (btnLeaveLobby) {
    btnLeaveLobby.addEventListener('click', () => {
      window.location.reload();
    });
  }

  // Draw Card from 3D Pile
  if (drawDeck3d) {
    drawDeck3d.addEventListener('click', () => {
      if (appState.roomId) {
        socket.emit('draw_card', { roomId: appState.roomId });
      }
    });
  }

  // UNO Button Click Call
  if (btnUno) {
    btnUno.addEventListener('click', () => {
      showToast('📣 Called UNO!');
      socket.emit('call_uno', { roomId: appState.roomId });
    });
  }

  // Exit Active Game
  if (btnExitGame) {
    btnExitGame.addEventListener('click', () => {
      window.location.reload();
    });
  }

  // Restart Match
  if (btnRestart) {
    btnRestart.addEventListener('click', () => {
      document.getElementById('game-over-modal').classList.add('hidden');
      if (appState.roomId) {
        socket.emit('start_game', { roomId: appState.roomId });
      }
    });
  }

  // Go to main menu
  if (btnHome) {
    btnHome.addEventListener('click', () => {
      window.location.reload();
    });
  }

  // Color Picker Modal Buttons for Wild Card Colors
  document.querySelectorAll('.color-opt').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const chosenColor = btn.getAttribute('data-color');
      document.getElementById('color-picker-modal').classList.add('hidden');

      if (appState.pendingWildCardId && appState.roomId) {
        socket.emit('play_card', {
          roomId: appState.roomId,
          cardId: appState.pendingWildCardId,
          chosenColor: chosenColor
        });
        appState.pendingWildCardId = null;
      }
    });
  });
}

// Bulletproof document ready state listener
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

// Helper Function to Switch Screen Views
function showScreen(screenId) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const target = document.getElementById(screenId);
  if (target) {
    target.classList.add('active');
  }
}
window.showScreen = showScreen;

// 3D Styled Toast Notification Helper
function showToast(msg) {
  const toast = document.getElementById('toast-message');
  if (!toast) return;

  toast.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> ${msg}`;
  toast.classList.remove('hidden');
  setTimeout(() => {
    toast.classList.add('hidden');
  }, 2800);
}
window.showToast = showToast;
