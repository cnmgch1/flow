import { useEffect } from 'react'

// https://github.com/excalidraw/excalidraw/blob/7eaf47c9d41a33a6230d8c3a16b5087fc720dcfb/src/packages/excalidraw/index.tsx#L66
export function useDisablePinchZooming(win?: Window) {
  useEffect(() => {
    const _win = win ?? window
    
    // Block pinch-zooming on iOS, but allow scrolling in content areas
    const handleTouchMove = (event: TouchEvent) => {
      // Only prevent default if there are multiple touches (pinch gesture)
      if (event.touches.length > 1) {
        event.preventDefault()
      }
    }

    // Also prevent double-tap zooming on iOS
    let lastTouchEnd = 0;
    const handleTouchEnd = (e: TouchEvent) => {
      const now = (new Date()).getTime();
      if (now - lastTouchEnd <= 300) {
        e.preventDefault();
      }
      lastTouchEnd = now;
    };

    _win.document.addEventListener('touchmove', handleTouchMove, {
      passive: false,
    })

    _win.document.addEventListener('touchend', handleTouchEnd, {
      passive: false,
    })

    return () => {
      _win.document.removeEventListener('touchmove', handleTouchMove)
      _win.document.removeEventListener('touchend', handleTouchEnd)
    }
  }, [win])
}
