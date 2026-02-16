import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  fetchCandidates,
  searchCandidatesByName,
  searchCandidatesBySkill,
  deleteCandidate,
} from '@/store/slices/candidatesSlice'
import { RootState } from '@/store'
import styles from './CandidateList.module.css'

const CandidateList = () => {
  const dispatch = useDispatch()
  const { candidates, loading } = useSelector((state: RootState) => state.candidates)
  const [searchType, setSearchType] = useState<'all' | 'name' | 'skill'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    dispatch(fetchCandidates())
  }, [dispatch])

  const handleSearch = () => {
    if (searchType === 'all' || !searchQuery.trim()) {
      dispatch(fetchCandidates())
    } else if (searchType === 'name') {
      dispatch(searchCandidatesByName(searchQuery))
    } else if (searchType === 'skill') {
      dispatch(searchCandidatesBySkill(searchQuery))
    }
  }

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this candidate?')) {
      dispatch(deleteCandidate(id))
    }
  }

  return (
    <div className={styles.candidateList}>
      <div className={styles.header}>
        <h2>Candidates ({candidates.length})</h2>
      </div>

      <div className={styles.searchBar}>
        <select
          value={searchType}
          onChange={(e) => setSearchType(e.target.value as any)}
          className={styles.searchSelect}
          aria-label="Search type selector"
        >
          <option value="all">All Candidates</option>
          <option value="name">Search by Name</option>
          <option value="skill">Search by Skill</option>
        </select>
        {searchType !== 'all' && (
          <input
            type="text"
            placeholder={`Enter ${searchType}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className={styles.searchInput}
          />
        )}
        <button onClick={handleSearch} className={styles.searchButton} disabled={loading}>
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>

      {loading && <p className={styles.loading}>Loading candidates...</p>}

      {!loading && candidates.length === 0 && (
        <div className={styles.empty}>
          <p>No candidates found. Upload some resumes to get started!</p>
        </div>
      )}

      {!loading && candidates.length > 0 && (
        <div className={styles.grid}>
          {candidates.map((candidate) => (
            <div key={candidate.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <h3>{candidate.name}</h3>
                {candidate.experience && (
                  <span className={styles.experience}>{candidate.experience} yrs</span>
                )}
              </div>
              <div className={styles.cardBody}>
                <div className={styles.info}>
                  <strong>Email:</strong> {candidate.email}
                </div>
                {candidate.mobile && (
                  <div className={styles.info}>
                    <strong>Mobile:</strong> {candidate.mobile}
                  </div>
                )}
                {candidate.currentCompany && (
                  <div className={styles.info}>
                    <strong>Company:</strong> {candidate.currentCompany}
                  </div>
                )}
                {candidate.education && (
                  <div className={styles.info}>
                    <strong>Education:</strong> {candidate.education}
                  </div>
                )}
                {candidate.skills && (
                  <div className={styles.skills}>
                    <strong>Skills:</strong>
                    <p>{candidate.skills}</p>
                  </div>
                )}
                {candidate.summary && (
                  <div className={styles.summary}>
                    <strong>Summary:</strong>
                    <p>{candidate.summary}</p>
                  </div>
                )}
              </div>
              <div className={styles.cardFooter}>
                <button
                  className={styles.deleteButton}
                  onClick={() => handleDelete(candidate.id)}
                >
                  Delete
                </button>
                <span className={styles.date}>
                  {new Date(candidate.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default CandidateList
