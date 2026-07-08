import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Analytics } from '@vercel/analytics/react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import '@app/styles/global.css'
import { ThemeProvider } from '@app/theme'
import { ScrollToTop } from './components/ScrollToTop'
import Embed from './pages/Embed/Embed'
import Home from './pages/Home/Home'
import Landing from './pages/Landing/Landing'
import TryIt from './pages/TryIt/TryIt'
import { ComponentLibrary, type ComponentLibrarySection } from './pages/ComponentLibrary/ComponentLibrary'

/** Internal component-library preview, wrapped in the fullscreen theme. */
const preview = (section: ComponentLibrarySection) => (
  <ThemeProvider fullscreen>
    <ComponentLibrary section={section} />
  </ThemeProvider>
)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/playground" element={<Landing />} />
        <Route path="/try-it" element={<TryIt />} />
        <Route path="/embed" element={<Embed />} />
        <Route path="/preview" element={preview('preview')} />
        <Route path="/preview/playground" element={preview('preview')} />
        <Route path="/preview/component" element={preview('component')} />
        <Route path="/preview/widget" element={preview('widget')} />
        {/* Unknown paths fall back to the marketing page (previous behaviour). */}
        <Route path="*" element={<Home />} />
      </Routes>
    </BrowserRouter>
    <Analytics />
  </StrictMode>,
)
