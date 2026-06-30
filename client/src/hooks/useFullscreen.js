import { useCallback, useEffect, useState } from "react"

export function useFullscreen() {
  const [isFullscreen, setIsFullscreen] = useState(
    () => Boolean(document.fullscreenElement)
  )

  useEffect(() => {
    const handleChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement))
    }

    document.addEventListener("fullscreenchange", handleChange)
    return () => document.removeEventListener("fullscreenchange", handleChange)
  }, [])

  const toggleFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen()
      } else {
        await document.documentElement.requestFullscreen()
      }
    } catch {
      // Fullscreen may be blocked by browser policy.
    }
  }, [])

  return { isFullscreen, toggleFullscreen }
}
