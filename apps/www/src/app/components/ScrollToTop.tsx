import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/** Reset scroll to the top on every route change (client nav preserves it otherwise). */
export function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}
