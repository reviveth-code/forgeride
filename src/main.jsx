import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'

// Auto dark mode based on system preference
const applyTheme = (dark) => document.documentElement.classList.toggle('dark', dark);
applyTheme(window.matchMedia('(prefers-color-scheme: dark)').matches);
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => applyTheme(e.matches));

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)