import { useEffect, useState, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  fetchJobs,
  createJob,
  updateJob,
  deleteJob,
  selectJob,
} from '@/store/slices/jobsSlice'
import type { Skill } from '@/store/slices/jobsSlice'
import { RootState } from '@/store'
import type { JobRequirement } from '@/store/slices/jobsSlice'
import SkillsInput from '@/components/SkillsInput/SkillsInput'
import RangeSlider from '@/components/RangeSlider/RangeSlider'
import { graphqlClient, SEARCH_SKILLS } from '@/services/graphql'
import styles from './JobRequirements.module.css'

const JobRequirements = () => {
  const dispatch = useDispatch()
  const { jobs, selectedJob, loading } = useSelector((state: RootState) => state.jobs)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState<Partial<JobRequirement>>({
    title: '',
    requiredSkills: '',
    skills: [],
    minExperienceYears: 0,
    maxExperienceYears: 10,
    requiredEducation: '',
    domainRequirements: '',
    description: '',
    isActive: true,
  })
  const [skillSuggestions, setSkillSuggestions] = useState<Skill[]>([])

  useEffect(() => {
    dispatch(fetchJobs())
  }, [dispatch])

  const handleSearchSkills = useCallback(async (query: string) => {
    if (!query || query.trim().length < 2) {
      setSkillSuggestions([])
      return
    }

    try {
      const data: { searchSkills: Skill[] } = await graphqlClient.request(SEARCH_SKILLS, {
        name: query.trim(),
      })
      setSkillSuggestions(data.searchSkills)
    } catch (error) {
      console.error('Error searching skills:', error)
      setSkillSuggestions([])
    }
  }, [])

  const handleCreateNew = () => {
    setFormData({
      title: '',
      requiredSkills: '',
      skills: [],
      minExperienceYears: 0,
      maxExperienceYears: 10,
      requiredEducation: '',
      domainRequirements: '',
      description: '',
      isActive: true,
    })
    dispatch(selectJob(null))
    setShowForm(true)
  }

  const handleEdit = (job: JobRequirement) => {
    setFormData({
      ...job,
      skills: job.skills || [],
    })
    dispatch(selectJob(job))
    setShowForm(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Extract skill IDs from selected skills
    const skillIds = formData.skills?.map((skill) => skill.id) || []
    
    const payload = {
      ...formData,
      skillIds,
    }
    
    if (selectedJob) {
      dispatch(updateJob({ ...selectedJob, ...payload } as JobRequirement))
    } else {
      dispatch(createJob(payload as Omit<JobRequirement, 'id' | 'createdAt'>))
    }
    setShowForm(false)
  }

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this job requirement?')) {
      dispatch(deleteJob(id))
    }
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === 'number'
          ? parseInt(value)
          : type === 'checkbox'
          ? (e.target as HTMLInputElement).checked
          : value,
    }))
  }

  return (
    <div className={styles.jobRequirements}>
      <div className={styles.header}>
        <h2>Job Requirements ({jobs.length})</h2>
        <button onClick={handleCreateNew} className={styles.createButton}>
          + Create New Job
        </button>
      </div>

      {showForm && (
        <div className={styles.formOverlay} onClick={() => setShowForm(false)}>
          <div className={styles.formModal} onClick={(e) => e.stopPropagation()}>
            <h3>{selectedJob ? 'Edit Job Requirement' : 'Create Job Requirement'}</h3>
            <form onSubmit={handleSubmit}>
              <div className={styles.formGroup}>
                <label htmlFor="job-title">Job Title *</label>
                <input
                  id="job-title"
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <RangeSlider
                  min={0}
                  max={40}
                  minValue={formData.minExperienceYears || 0}
                  maxValue={formData.maxExperienceYears || 10}
                  step={1}
                  label="Experience Range (years) *"
                  unit="years"
                  onChange={(minValue, maxValue) =>
                    setFormData({
                      ...formData,
                      minExperienceYears: minValue,
                      maxExperienceYears: maxValue,
                    })
                  }
                />
              </div>
              <div className={styles.formGroup}>
                <label>Required Skills *</label>
                <SkillsInput
                  selectedSkills={formData.skills || []}
                  onChange={(skills) => setFormData({ ...formData, skills })}
                  onSearch={handleSearchSkills}
                  suggestions={skillSuggestions}
                  placeholder="Type to search and add skills (e.g., Java, Spring, React)..."
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="required-education">Required Education</label>
                <input
                  id="required-education"
                  type="text"
                  name="requiredEducation"
                  value={formData.requiredEducation}
                  onChange={handleChange}
                  placeholder="e.g., Bachelor's in Computer Science"
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="domain">Domain</label>
                <input
                  id="domain"
                  type="text"
                  name="domainRequirements"
                  value={formData.domainRequirements}
                  onChange={handleChange}
                  placeholder="e.g., Fintech, Healthcare, E-commerce"
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="description">Job Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={5}
                  placeholder="Detailed job description..."
                />
              </div>
              <div className={styles.formActions}>
                <button type="button" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
                <button type="submit" className={styles.submitButton}>
                  {selectedJob ? 'Update' : 'Create'} Job
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading && <p className={styles.loading}>Loading jobs...</p>}

      {!loading && jobs.length === 0 && (
        <div className={styles.empty}>
          <p>No job requirements found. Create one to start matching candidates!</p>
        </div>
      )}

      {!loading && jobs.length > 0 && (
        <div className={styles.grid}>
          {jobs.map((job) => (
            <div key={job.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <h3>{job.title}</h3>
                <span className={job.isActive ? styles.active : styles.inactive}>
                  {job.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className={styles.cardBody}>
                <div className={styles.info}>
                  <strong>Experience:</strong> {job.minExperienceYears} - {job.maxExperienceYears} years
                </div>
                <div className={styles.info}>
                  <strong>Required Skills:</strong>
                  {job.skills && job.skills.length > 0 ? (
                    <div className={styles.skillBadges}>
                      {job.skills.map((skill) => (
                        <span key={skill.id} className={styles.skillBadge}>
                          {skill.name}
                          {skill.category && (
                            <span className={styles.skillCategory}>{skill.category}</span>
                          )}
                        </span>
                      ))}
                    </div>
                  ) : job.requiredSkills ? (
                    <span>{job.requiredSkills}</span>
                  ) : (
                    <span>Not specified</span>
                  )}
                </div>
                {job.requiredEducation && (
                  <div className={styles.info}>
                    <strong>Education:</strong> {job.requiredEducation}
                  </div>
                )}
                {job.domainRequirements && (
                  <div className={styles.info}>
                    <strong>Domain:</strong> {job.domainRequirements}
                  </div>
                )}
                {job.description && (
                  <div className={styles.description}>
                    <strong>Description:</strong>
                    <p>{job.description}</p>
                  </div>
                )}
              </div>
              <div className={styles.cardFooter}>
                <button className={styles.editButton} onClick={() => handleEdit(job)}>
                  Edit
                </button>
                <button className={styles.deleteButton} onClick={() => handleDelete(job.id)}>
                  Delete
                </button>
                <span className={styles.date}>
                  {new Date(job.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default JobRequirements
