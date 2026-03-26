// main.js - App entry point

window.addEventListener('DOMContentLoaded', () => {
  // Initialise game canvas engine
  const canvas = document.getElementById('gameCanvas');
  initGame(canvas);

  // Initialise UI (builds screens, wires buttons)
  initUI();

  // Prevent default scroll/zoom on touch
  document.addEventListener('touchmove', e => e.preventDefault(), { passive: false });
  document.addEventListener('touchstart', e => {
    if (e.touches.length > 1) e.preventDefault();
  }, { passive: false });

  // Prevent context menu on long press
  window.addEventListener('contextmenu', e => e.preventDefault());
});
