import { useCallback, useEffect, useRef, useState } from 'react'

function describeError(e: unknown) {
  const name = e instanceof DOMException ? e.name : ''
  if (name === 'NotAllowedError' || name === 'SecurityError')
    return 'Camera access was blocked. Allow camera permission in your browser, or upload a photo instead.'
  if (name === 'NotFoundError' || name === 'OverconstrainedError')
    return 'No camera was found on this device. Upload a photo instead.'
  if (name === 'NotReadableError')
    return 'The camera is being used by another app. Close it and try again, or upload a photo instead.'
  return 'Could not start the camera. Try again, or upload a photo instead.'
}

export function useCamera() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const attempt = useRef(0)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const stop = useCallback(() => {
    attempt.current += 1 // cancels any start() that is still waiting for permission
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    setReady(false)
  }, [])

  const start = useCallback(async () => {
    const id = ++attempt.current
    setError(null)
    setReady(false)

    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Camera is not available here. Open the site on localhost or https, or upload a photo instead.')
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } }, // back camera on phones
        audio: false,
      })
      if (id !== attempt.current) {
        stream.getTracks().forEach((t) => t.stop())
        return
      }
      streamRef.current = stream
      const video = videoRef.current
      if (video) {
        video.srcObject = stream
        await video.play()
      }
      if (id === attempt.current) setReady(true)
    } catch (e) {
      if (id === attempt.current) setError(describeError(e))
    }
  }, [])

  // Always release the camera when the component using it goes away
  useEffect(() => stop, [stop])

  return { videoRef, ready, error, start, stop }
}