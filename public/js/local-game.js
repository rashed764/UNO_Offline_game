/**
 * Local Client-Side Game Controller for Singleplayer "Vs Computer" Mode
 * Runs 100% locally in browser using GameEngine and BotPlayer without Socket.io.
 */

let localGame = null;
const HUMAN_PLAYER_ID = 'human_player_1';

function initLocalAiGame(playerName = 'Player 1') {
  console.log('🤖 Initializing Local Singleplayer AI Match for:', playerName);

  if (typeof GameEngine === 'undefined') {
    console.error('[LocalGame] GameEngine is not loaded!');
    if (typeof showToast === 'function') showToast('⚠️ GameEngine not loaded!');
    return;
  }

  // 1. Instantiate GameEngine in 'ai' mode
  localGame = new GameEngine('AI-ROOM', 'ai');

  // 2. Register Human Player
  const humanPlayer = {
    id: HUMAN_PLAYER_ID,
    name: playerName,
    isHost: true,
    isBot: false,
    hand: []
  };
  localGame.addPlayer(humanPlayer);

  // 3. Register 3 AI Bot Players
  if (typeof BotPlayer !== 'undefined') {
    const bots = [
      new BotPlayer('bot_alice', 'Bot Alice'),
      new BotPlayer('bot_bob', 'Bot Bob'),
      new BotPlayer('bot_charlie', 'Bot Charlie')
    ];
    bots.forEach(bot => localGame.addPlayer(bot));
  } else {
    console.warn('[LocalGame] BotPlayer not loaded, falling back to basic bots.');
  }

  // 4. Start the game
  localGame.startGame();

  // 5. Switch to Game Screen
  if (window.showScreen) {
    window.showScreen('game-screen');
  }

  const roomIdEl = document.getElementById('game-room-id');
  if (roomIdEl) roomIdEl.textContent = 'OFFLINE AI';

  // 6. Initial Render
  updateAndRenderLocalGame();

  // Check if active player is a bot (just in case)
  checkAndRunAiTurn();
}

function updateAndRenderLocalGame() {
  if (!localGame) return;
  const gameState = localGame.getGameState(HUMAN_PLAYER_ID);
  if (typeof renderGameBoard === 'function') {
    renderGameBoard(gameState);
  }

  // Check winner
  if (localGame.winner) {
    handleLocalGameOver(localGame.winner);
  }
}

function handleLocalGameOver(winner) {
  const winnerTitle = document.getElementById('game-winner-title');
  const winnerMsg = document.getElementById('game-winner-message');
  const gameOverModal = document.getElementById('game-over-modal');

  if (winnerTitle && winnerMsg && gameOverModal) {
    const isHuman = String(winner.id) === String(HUMAN_PLAYER_ID);
    winnerTitle.textContent = isHuman ? 'VICTORY!' : 'DEFEAT!';
    winnerMsg.textContent = isHuman 
      ? 'Congratulations, you successfully cleared your hand and won the match!' 
      : `${winner.name} won the match! Better luck next time.`;
    gameOverModal.classList.remove('hidden');
  }
}

// Intercept local human actions
function handleLocalCardClick(card) {
  if (!localGame) return;

  const isWild = (card.color === 'wild' || card.value === 'wild' || card.value === 'wild_draw4');
  if (isWild) {
    window.appState = window.appState || {};
    window.appState.pendingWildCardId = card.id;
    window.appState.isLocalGame = true;
    const colorPicker = document.getElementById('color-picker-modal');
    if (colorPicker) colorPicker.classList.remove('hidden');
  } else {
    executeLocalPlay(card.id, null);
  }
}

function executeLocalPlay(cardId, chosenColor) {
  if (!localGame) return;
  const result = localGame.playCard(HUMAN_PLAYER_ID, cardId, chosenColor);
  if (!result.success) {
    if (typeof showToast === 'function') {
      showToast(result.reason || 'Illegal move!');
    }
  } else {
    updateAndRenderLocalGame();
    if (!localGame.winner) {
      setTimeout(checkAndRunAiTurn, 400);
    }
  }
}

function handleLocalDrawCard() {
  if (!localGame) return;
  const result = localGame.drawCardForPlayer(HUMAN_PLAYER_ID);
  if (!result.success) {
    if (typeof showToast === 'function') {
      showToast(result.reason || 'Cannot draw card right now.');
    }
  } else {
    updateAndRenderLocalGame();
  }
}

function handleLocalPassTurn() {
  if (!localGame) return;
  const success = localGame.passTurn(HUMAN_PLAYER_ID);
  if (success) {
    updateAndRenderLocalGame();
    if (!localGame.winner) {
      setTimeout(checkAndRunAiTurn, 400);
    }
  } else {
    if (typeof showToast === 'function') {
      showToast('You cannot pass right now.');
    }
  }
}

function handleLocalCallUno() {
  if (!localGame) return;
  localGame.callUno(HUMAN_PLAYER_ID);
  if (typeof showToast === 'function') {
    showToast('📣 Called UNO!');
  }
}

// AI Turn Execution Loop
function checkAndRunAiTurn() {
  if (!localGame || !localGame.isGameStarted || localGame.winner) return;

  const activePlayer = localGame.getActivePlayer();
  if (!activePlayer || !activePlayer.isBot) {
    return; // Human turn, wait for user input
  }

  console.log(`[Local AI] Thinking turn for ${activePlayer.name}...`);

  const thinkingDelay = Math.floor(Math.random() * 400) + 800;

  setTimeout(() => {
    if (!localGame || !localGame.isGameStarted || localGame.winner) return;
    const currentActive = localGame.getActivePlayer();
    if (!currentActive || String(currentActive.id) !== String(activePlayer.id)) return;

    const topCard = localGame.discardPile[localGame.discardPile.length - 1];
    let cardToPlay = typeof activePlayer.chooseCardToPlay === 'function' 
      ? activePlayer.chooseCardToPlay(topCard, localGame.currentColor)
      : activePlayer.hand.find(c => c.color === localGame.currentColor || c.value === localGame.currentValue || c.color === 'wild');

    if (!cardToPlay) {
      // Bot must draw
      const drawResult = localGame.drawCardForPlayer(activePlayer.id);
      if (!drawResult.success) {
        localGame.advanceTurn(1);
        updateAndRenderLocalGame();
        setTimeout(checkAndRunAiTurn, 500);
        return;
      }

      updateAndRenderLocalGame();

      if (!drawResult.isPlayable) {
        localGame.passTurn(activePlayer.id);
        updateAndRenderLocalGame();
        setTimeout(checkAndRunAiTurn, 500);
        return;
      }

      cardToPlay = drawResult.drawnCard;
    }

    // Play card delay
    setTimeout(() => {
      if (!localGame || !localGame.isGameStarted || localGame.winner) return;
      const verifyActive = localGame.getActivePlayer();
      if (!verifyActive || String(verifyActive.id) !== String(activePlayer.id)) return;

      const isWild = (cardToPlay.color === 'wild' || cardToPlay.value === 'wild' || cardToPlay.color === 'wild_draw4');
      const chosenColor = isWild && typeof activePlayer.chooseBestColor === 'function'
        ? activePlayer.chooseBestColor()
        : 'red';

      if (activePlayer.hand.length === 2) {
        localGame.callUno(activePlayer.id);
        if (typeof showToast === 'function') {
          showToast(`📣 Bot ${activePlayer.name} called UNO!`);
        }
      }

      const playRes = localGame.playCard(activePlayer.id, cardToPlay.id, chosenColor);
      if (!playRes.success) {
        if (!localGame.hasDrawnThisTurn) {
          localGame.drawCardForPlayer(activePlayer.id);
        }
        if (localGame.canPass) {
          localGame.passTurn(activePlayer.id);
        } else {
          localGame.advanceTurn(1);
        }
      }

      updateAndRenderLocalGame();

      if (!localGame.winner) {
        setTimeout(checkAndRunAiTurn, 600);
      }
    }, 500);
  }, thinkingDelay);
}

// Bind UI event overrides when Vs AI is selected
document.addEventListener('DOMContentLoaded', () => {
  const btnVsAi = document.getElementById('btn-vs-ai');
  const nameInput = document.getElementById('player-name');

  if (btnVsAi) {
    btnVsAi.replaceWith(btnVsAi.cloneNode(true));
    const newBtnVsAi = document.getElementById('btn-vs-ai');

    newBtnVsAi.addEventListener('click', () => {
      const name = (nameInput && nameInput.value.trim()) ? nameInput.value.trim() : 'Player 1';
      window.appState = window.appState || {};
      window.appState.playerName = name;
      window.appState.mode = 'ai';
      window.appState.isLocalGame = true;

      initLocalAiGame(name);
    });
  }

  // Intercept Draw Deck click for local game
  const drawDeck3d = document.getElementById('draw-deck-3d');
  if (drawDeck3d) {
    drawDeck3d.addEventListener('click', () => {
      if (window.appState && window.appState.isLocalGame) {
        handleLocalDrawCard();
      }
    });
  }

  // Intercept Pass Turn click for local game
  const btnPass = document.getElementById('btn-pass-turn');
  if (btnPass) {
    btnPass.addEventListener('click', () => {
      if (window.appState && window.appState.isLocalGame) {
        handleLocalPassTurn();
      }
    });
  }

  // Intercept UNO button for local game
  const btnUno = document.getElementById('btn-uno');
  if (btnUno) {
    btnUno.addEventListener('click', () => {
      if (window.appState && window.appState.isLocalGame) {
        handleLocalCallUno();
      }
    });
  }

  // Intercept Wild Color Picker for local game
  document.querySelectorAll('.color-opt').forEach(btn => {
    btn.addEventListener('click', () => {
      if (window.appState && window.appState.isLocalGame && window.appState.pendingWildCardId) {
        const chosenColor = btn.getAttribute('data-color');
        const cardId = window.appState.pendingWildCardId;
        window.appState.pendingWildCardId = null;
        executeLocalPlay(cardId, chosenColor);
      }
    });
  });

  // Intercept Restart and Home for local game
  const btnRestart = document.getElementById('btn-restart');
  if (btnRestart) {
    btnRestart.addEventListener('click', () => {
      if (window.appState && window.appState.isLocalGame) {
        document.getElementById('game-over-modal').classList.add('hidden');
        initLocalAiGame(window.appState.playerName || 'Player 1');
      }
    });
  }
});

// Expose handleCardClick override for local game
window.handleCardClick = function(card) {
  if (window.appState && window.appState.isLocalGame) {
    handleLocalCardClick(card);
  } else {
    if (typeof socket !== 'undefined' && window.appState && window.appState.roomId) {
      if (card.color === 'wild' || card.color === 'wild_draw4') {
        window.appState.pendingWildCardId = card.id;
        document.getElementById('color-picker-modal').classList.remove('hidden');
      } else {
        socket.emit('play_card', { roomId: window.appState.roomId, cardId: card.id });
      }
    }
  }
};
