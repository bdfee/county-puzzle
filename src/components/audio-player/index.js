import { useRef, forwardRef, useImperativeHandle } from 'react'
import { snap, snapReverb } from './audio.js'

const AudioPlayer = forwardRef((_, ref) => {
  const audioRef = useRef(null)

  useImperativeHandle(ref, () => ({
    playAudio: (count) => {
      if (audioRef.current) {
        const audio = audioRef.current
        audio.src = count === 0 ? snapReverb : snap
        audio.currentTime = 0.3
        audio.play()
      }
    }
  }))

  return (
    <audio ref={audioRef}>
      <source type="audio/mpeg" />
    </audio>
  )
})

AudioPlayer.displayName = 'AudioPlayer'

export default AudioPlayer
