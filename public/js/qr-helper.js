/**
 * QR Code Helper Utilities for ShareIt-style Wi-Fi Multiplayer
 * Uses QRCode.js for generation and Html5Qrcode for camera scanning.
 */

let html5QrCodeScanner = null;

/**
 * Generates a QR Code in the specified DOM element container.
 * @param {string|HTMLElement} elementId - Container ID or DOM element.
 * @param {string} text - Text/URL to encode into QR code.
 * @param {number} width - Width in pixels (default 180).
 * @param {number} height - Height in pixels (default 180).
 */
function generateQRCode(elementId, text, width = 180, height = 180) {
  const container = typeof elementId === 'string' ? document.getElementById(elementId) : elementId;
  if (!container) {
    console.error('[QrHelper] Container element not found:', elementId);
    return;
  }

  container.innerHTML = '';

  if (typeof QRCode === 'undefined') {
    console.error('[QrHelper] QRCode library is not loaded!');
    container.textContent = text; // Fallback display text
    return;
  }

  try {
    new QRCode(container, {
      text: text,
      width: width,
      height: height,
      colorDark: '#000000',
      colorLight: '#ffffff',
      correctLevel: QRCode.CorrectLevel.H
    });
    console.log('[QrHelper] Successfully generated QR code for:', text);
  } catch (err) {
    console.error('[QrHelper] Failed to generate QR code:', err);
    container.textContent = text;
  }
}

/**
 * Starts the camera scanner for QR codes.
 * @param {string} elementId - DOM element ID where scanner is rendered.
 * @param {function} onScanSuccess - Callback function(decodedText, decodedResult) when QR is successfully scanned.
 * @param {function} [onScanError] - Optional callback function(errorMessage) on scan failure/frame drop.
 */
async function startQrScanner(elementId, onScanSuccess, onScanError) {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error('[QrHelper] Scanner container element not found:', elementId);
    return false;
  }

  if (typeof Html5Qrcode === 'undefined') {
    console.error('[QrHelper] Html5Qrcode library is not loaded!');
    if (typeof showToast === 'function') showToast('⚠️ QR Scanner library not loaded!');
    return false;
  }

  try {
    if (!html5QrCodeScanner) {
      html5QrCodeScanner = new Html5Qrcode(elementId);
    }

    const config = { fps: 10, qrbox: { width: 250, height: 250 } };
    
    await html5QrCodeScanner.start(
      { facingMode: "environment" },
      config,
      (decodedText, decodedResult) => {
        console.log(`[QrHelper] Scanned QR Code: ${decodedText}`, decodedResult);
        if (typeof onScanSuccess === 'function') {
          onScanSuccess(decodedText, decodedResult);
        }
        stopQrScanner();
      },
      (errorMessage) => {
        // frame parse errors are frequent during scanning, log quietly or invoke optional error
        if (typeof onScanError === 'function' && errorMessage && !errorMessage.includes('NotFound')) {
          onScanError(errorMessage);
        }
      }
    );

    console.log('[QrHelper] Camera QR scanner started successfully.');
    return true;
  } catch (err) {
    console.error('[QrHelper] Failed to start camera scanner:', err);
    if (typeof showToast === 'function') {
      showToast('⚠️ Could not access camera for QR scanning.');
    }
    return false;
  }
}

/**
 * Stops the active camera QR scanner.
 */
async function stopQrScanner() {
  if (html5QrCodeScanner) {
    try {
      await html5QrCodeScanner.stop();
      await html5QrCodeScanner.clear();
      console.log('[QrHelper] Camera scanner stopped and cleared.');
    } catch (err) {
      console.warn('[QrHelper] Error stopping scanner:', err);
    }
    html5QrCodeScanner = null;
  }
}

// Expose globally
window.generateQRCode = generateQRCode;
window.startQrScanner = startQrScanner;
window.stopQrScanner = stopQrScanner;
