// ============================================================
// RESPONSIVE SCALING
// The game always renders to a fixed 640x640 internal canvas.
// This scales the whole #wrapper (canvas + HUD + screens) via
// CSS transform to fit whatever viewport it's shown in, instead
// of touching canvas resolution or any of the 640-based layout math.
// ============================================================

function fitGame() {
  const wrapper = document.getElementById('wrapper');
  const margin = 0.97; // small breathing room so nothing touches the edge
  const scale = Math.min(window.innerWidth / 640, window.innerHeight / 640) * margin;
  wrapper.style.transform = `scale(${scale})`;
}

window.addEventListener('resize', fitGame);
window.addEventListener('orientationchange', fitGame);
window.addEventListener('load', fitGame);
document.addEventListener('visibilitychange', () => { if (!document.hidden) fitGame(); });
fitGame();
