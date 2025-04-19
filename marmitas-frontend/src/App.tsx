import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <div className="app-container">
        <header className="app-header">
          <h1>Marmitas</h1>
        </header>
        <main className="app-content">
          <Routes>
            <Route path="/" element={<div>Home Page</div>} />
            <Route path="*" element={<div>Not Found</div>} />
          </Routes>
        </main>
        <footer className="app-footer">
          <p>&copy; {new Date().getFullYear()} Marmitas. All rights reserved.</p>
        </footer>
      </div>
    </BrowserRouter>
  )
}

export default App 