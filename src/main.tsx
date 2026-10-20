import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { garantirSeed } from './db/seed'

garantirSeed().finally(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
})
