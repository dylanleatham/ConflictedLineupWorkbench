import { BrowserRouter, Routes, Route } from 'react-router-dom'
import TestCaseList from './pages/TestCaseList'
import TestCaseCreate from './pages/TestCaseCreate'
import TestCaseDetail from './pages/TestCaseDetail'
import TestCaseEdit from './pages/TestCaseEdit'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<TestCaseList />} />
        <Route path="/test-cases/new" element={<TestCaseCreate />} />
        <Route path="/test-cases/:id" element={<TestCaseDetail />} />
        <Route path="/test-cases/:id/edit" element={<TestCaseEdit />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
