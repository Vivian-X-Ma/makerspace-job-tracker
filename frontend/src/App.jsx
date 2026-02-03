import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import SubmissionForm from './components/submissionForm'
import Dashboard from './components/Dashboard'
import './App.css'

function App() {
  return (
    <Router>
    
      <Routes>
        <Route path="/" element={<SubmissionForm />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </Router>
  )
}

export default App