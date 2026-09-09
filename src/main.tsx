import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './App'
import { Overlay } from './overlay/Overlay'
import './assets/fonts/thmanyah.css'
import '@fontsource/outfit/400.css'
import '@fontsource/outfit/500.css'
import '@fontsource/outfit/600.css'
import '@fontsource/outfit/700.css'
import './styles.css'

const isOverlay = new URLSearchParams(window.location.search).get('overlay') === '1'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {isOverlay ? <Overlay /> : <App />}
  </React.StrictMode>
)
