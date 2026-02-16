import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout/Layout'
import Dashboard from './pages/Dashboard/Dashboard'
import CandidateList from './pages/CandidateList/CandidateList'
import JobRequirements from './pages/JobRequirements/JobRequirements'
import CandidateMatching from './pages/CandidateMatching/CandidateMatching'
import FileUpload from './pages/FileUpload/FileUpload'
import SkillsManager from './pages/SkillsManager/SkillsManager'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="upload" element={<FileUpload />} />
        <Route path="candidates" element={<CandidateList />} />
        <Route path="jobs" element={<JobRequirements />} />
        <Route path="matching" element={<CandidateMatching />} />
        <Route path="skills" element={<SkillsManager />} />
      </Route>
    </Routes>
  )
}

export default App
