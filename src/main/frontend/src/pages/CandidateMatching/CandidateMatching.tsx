import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchCandidates } from '@/store/slices/candidatesSlice'
import { fetchJobs } from '@/store/slices/jobsSlice'
import {
  fetchMatchesForJob,
  matchAllCandidatesToJob,
  updateMatchStatus,
} from '@/store/slices/matchesSlice'
import { RootState } from '@/store'
import styles from './CandidateMatching.module.css'

const CandidateMatching = () => {
  const dispatch = useDispatch()
  const { candidates } = useSelector((state: RootState) => state.candidates)
  const { jobs } = useSelector((state: RootState) => state.jobs)
  const { matches, matchingInProgress } = useSelector((state: RootState) => state.matches)
  const [selectedJobId, setSelectedJobId] = useState<string>('')

  useEffect(() => {
    dispatch(fetchCandidates())
    dispatch(fetchJobs())
  }, [dispatch])

  useEffect(() => {
    if (selectedJobId) {
      dispatch(fetchMatchesForJob({ jobId: selectedJobId, limit: 50 }))
    }
  }, [selectedJobId, dispatch])

  const handleMatchAll = () => {
    if (selectedJobId) {
      dispatch(matchAllCandidatesToJob(selectedJobId))
    }
  }

  const handleShortlist = (matchId: string, currentStatus: boolean) => {
    dispatch(updateMatchStatus({ matchId, isShortlisted: !currentStatus }))
  }

  const handleSelect = (matchId: string, currentStatus: boolean) => {
    dispatch(updateMatchStatus({ matchId, isSelected: !currentStatus }))
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return styles.excellent
    if (score >= 70) return styles.good
    if (score >= 50) return styles.average
    return styles.poor
  }

  const selectedJob = jobs.find((j) => j.id === selectedJobId)
  const matchesWithCandidates = matches.map((match) => ({
    ...match,
    candidate: candidates.find((c) => c.id === match.candidateId),
  }))

  return (
    <div className={styles.matching}>
      <h2>Candidate Matching</h2>

      <div className={styles.controls}>
        <div className={styles.jobSelect}>
          <label htmlFor="job-selector">Select Job Requirement:</label>
          <select
            id="job-selector"
            value={selectedJobId}
            onChange={(e) => setSelectedJobId(e.target.value)}
            className={styles.select}
            aria-label="Job requirement selector"
          >
            <option value="">Choose a job...</option>
            {jobs
              .filter((job) => job.isActive)
              .map((job) => (
                <option key={job.id} value={job.id}>
                  {job.title} ({job.minExperienceYears}-{job.maxExperienceYears} yrs)
                </option>
              ))}
          </select>
        </div>
        {selectedJobId && (
          <button
            onClick={handleMatchAll}
            className={styles.matchButton}
            disabled={matchingInProgress}
          >
            {matchingInProgress ? 'Matching...' : 'Match All Candidates'}
          </button>
        )}
      </div>

      {selectedJob && (
        <div className={styles.jobInfo}>
          <h3>{selectedJob.title}</h3>
          <p>
            <strong>Experience:</strong> {selectedJob.minExperienceYears} - {selectedJob.maxExperienceYears}{' '}
            years
          </p>
          <p>
            <strong>Required Skills:</strong> {selectedJob.requiredSkills}
          </p>
        </div>
      )}

      {matchesWithCandidates.length === 0 && selectedJobId && (
        <div className={styles.empty}>
          <p>No matches found. Click "Match All Candidates" to generate AI-powered matches.</p>
        </div>
      )}

      {matchesWithCandidates.length > 0 && (
        <div className={styles.matchList}>
          {matchesWithCandidates.map((match) => (
            <div key={match.id} className={styles.matchCard}>
              <div className={styles.matchHeader}>
                <div>
                  <h4>{match.candidate?.name || 'Unknown Candidate'}</h4>
                  <span className={styles.email}>{match.candidate?.email}</span>
                </div>
                <div className={`${styles.score} ${getScoreColor(match.matchScore)}`}>
                  {match.matchScore}%
                </div>
              </div>

              <div className={styles.scoreBreakdown}>
                <div className={styles.scoreItem}>
                  <span>Skills</span>
                  <div className={styles.scoreBar}>
                    <div
                      className={styles.scoreFill}
                      style={{ width: `${match.skillsScore}%` }}
                    />
                  </div>
                  <span>{match.skillsScore}%</span>
                </div>
                <div className={styles.scoreItem}>
                  <span>Experience</span>
                  <div className={styles.scoreBar}>
                    <div
                      className={styles.scoreFill}
                      style={{ width: `${match.experienceScore}%` }}
                    />
                  </div>
                  <span>{match.experienceScore}%</span>
                </div>
                <div className={styles.scoreItem}>
                  <span>Education</span>
                  <div className={styles.scoreBar}>
                    <div
                      className={styles.scoreFill}
                      style={{ width: `${match.educationScore}%` }}
                    />
                  </div>
                  <span>{match.educationScore}%</span>
                </div>
                <div className={styles.scoreItem}>
                  <span>Domain</span>
                  <div className={styles.scoreBar}>
                    <div
                      className={styles.scoreFill}
                      style={{ width: `${match.domainScore}%` }}
                    />
                  </div>
                  <span>{match.domainScore}%</span>
                </div>
              </div>

              {match.explanation && (
                <div className={styles.explanation}>
                  <strong>AI Analysis:</strong>
                  <p>{match.explanation}</p>
                </div>
              )}

              <div className={styles.matchActions}>
                <button
                  className={match.isShortlisted ? styles.shortlisted : styles.shortlistButton}
                  onClick={() => handleShortlist(match.id, match.isShortlisted)}
                >
                  {match.isShortlisted ? '✓ Shortlisted' : 'Shortlist'}
                </button>
                <button
                  className={match.isSelected ? styles.selected : styles.selectButton}
                  onClick={() => handleSelect(match.id, match.isSelected)}
                >
                  {match.isSelected ? '✓ Selected' : 'Select'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default CandidateMatching
