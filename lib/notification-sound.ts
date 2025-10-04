"use client"

export function playNotificationSound() {
  try {
    // Using Web Audio API for a simple beep
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    oscillator.frequency.value = 800 // Frequency in Hz
    oscillator.type = 'sine'

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)

    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.5)
  } catch (error) {
    console.error('Could not play notification sound:', error)
  }
}

// Alternative: Use a custom sound file
export function playCustomNotificationSound() {
  try {
    const audio = new Audio('/sounds/notification.mp3') // Add your sound file to public/sounds/
    audio.volume = 0.5
    audio.play().catch(err => console.error('Could not play sound:', err))
  } catch (error) {
    console.error('Could not play notification sound:', error)
  }
}