/**
 * useKeyboardSound — Custom hook that provides mechanical keyboard sound
 * effects for typing feedback. Audio objects are lazily initialized on first
 * use so no DOM-coupled objects are created at module-import time.
 */

let _sounds = null;

/** Lazy-init singleton: creates Audio objects exactly once, on first call. */
function getKeyStrokeSounds() {
  if (!_sounds) {
    _sounds = [
      new Audio("/sounds/keystroke1.mp3"),
      new Audio("/sounds/keystroke2.mp3"),
      new Audio("/sounds/keystroke3.mp3"),
      new Audio("/sounds/keystroke4.mp3"),
    ];
  }
  return _sounds;
}

function useKeyboardSound() {
  const playRandomKeyStrokeSound = () => {
    const sounds = getKeyStrokeSounds();
    const randomSound = sounds[Math.floor(Math.random() * sounds.length)];
    // Reset playback position so rapid keystrokes always play from the start
    randomSound.currentTime = 0;
    randomSound.play().catch((error) => console.warn("Audio play failed:", error));
  };

  return { playRandomKeyStrokeSound };
}

export default useKeyboardSound;
