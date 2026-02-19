import { GraphQLClient, ClientError } from 'graphql-request'

const endpoint = window.location.origin + '/graphql'

/**
 * Create a GraphQLClient with the current Authorization token.
 * Reads token from localStorage on each call to stay fresh.
 */
function buildHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  const token = localStorage.getItem('accessToken')
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  return headers
}

/**
 * Attempt to refresh the access token using the stored refresh token.
 * Returns the new access token on success, or null on failure.
 */
async function tryRefreshToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem('refreshToken')
  if (!refreshToken) return null

  try {
    const response = await fetch(window.location.origin + '/api/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    })
    if (!response.ok) return null

    const data = await response.json()
    const newAccessToken = data.accessToken || data.token
    const newRefreshToken = data.refreshToken

    if (newAccessToken) {
      localStorage.setItem('accessToken', newAccessToken)
    }
    if (newRefreshToken) {
      localStorage.setItem('refreshToken', newRefreshToken)
    }
    return newAccessToken ?? null
  } catch {
    return null
  }
}

/**
 * Check if a GraphQL error response contains an UNAUTHORIZED error.
 */
function isUnauthorizedError(error: unknown): boolean {
  if (error instanceof ClientError) {
    const errors = error.response?.errors ?? []
    return errors.some(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (e: any) =>
        e?.extensions?.classification === 'UNAUTHORIZED' ||
        e?.message === 'Unauthorized' ||
        e?.extensions?.errorType === 'UNAUTHORIZED'
    )
  }
  return false
}

/**
 * Execute a GraphQL request with automatic token refresh on UNAUTHORIZED errors.
 * Falls back to redirecting to /login if refresh fails.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function gqlRequestWithRefresh<T = any>(
  query: string,
  variables?: Record<string, unknown>
): Promise<T> {
  const client = new GraphQLClient(endpoint, {
    headers: buildHeaders(),
  })

  try {
    return await client.request<T>(query, variables)
  } catch (error) {
    if (isUnauthorizedError(error)) {
      // Try to refresh the token
      const newToken = await tryRefreshToken()
      if (newToken) {
        // Retry with fresh token
        const retryClient = new GraphQLClient(endpoint, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${newToken}`,
          },
        })
        return await retryClient.request<T>(query, variables)
      } else {
        // Refresh failed — redirect to login
        localStorage.clear()
        window.location.href = '/login'
        throw error
      }
    }
    throw error
  }
}

export const graphqlClient = new GraphQLClient(endpoint, {
  requestMiddleware: (request) => ({
    ...request,
    headers: {
      ...request.headers,
      ...buildHeaders(),
    },
  }),
})

// GraphQL Queries
export const GET_ALL_CANDIDATES = `
  query {
    allCandidates {
      id
      name
      email
      mobile
      skills
      yearsOfExperience
      academicBackground
      experienceSummary
      createdAt
    }
  }
`

export const SEARCH_CANDIDATES_BY_NAME = `
  query SearchByName($name: String!) {
    searchCandidatesByName(name: $name) {
      id
      name
      email
      mobile
      skills
      yearsOfExperience
      academicBackground
      experienceSummary
      createdAt
    }
  }
`

export const SEARCH_CANDIDATES_BY_SKILL = `
  query SearchBySkill($skill: String!) {
    searchCandidatesBySkill(skill: $skill) {
      id
      name
      email
      mobile
      skills
      yearsOfExperience
      academicBackground
      experienceSummary
      createdAt
    }
  }
`

export const GET_ALL_JOBS = `
  query {
    allJobRequirements {
      id
      title
      requiredSkills
      skills {
        id
        name
        category
      }
      minExperienceYears
      maxExperienceYears
      requiredEducation
      domainRequirements
      description
      isActive
      createdAt
    }
  }
`

export const GET_MATCHES_FOR_JOB = `
  query MatchesForJob($jobRequirementId: UUID!, $limit: Int) {
    matchesForJob(jobRequirementId: $jobRequirementId, limit: $limit) {
      id
      candidate { id }
      jobRequirement { id }
      matchScore
      skillsScore
      experienceScore
      educationScore
      domainScore
      matchExplanation
      isShortlisted
      isSelected
      createdAt
    }
  }
`

export const GET_PROCESS_STATUS = `
  query ProcessStatus($trackerId: UUID!) {
    processStatus(trackerId: $trackerId) {
      id
      status
      totalFiles
      processedFiles
      failedFiles
      startTime
      endTime
      errorMessage
    }
  }
`

// GraphQL Mutations
export const CREATE_JOB = `
  mutation CreateJob(
    $title: String!
    $requiredSkills: String
    $skillIds: [UUID!]
    $minExperience: Int!
    $maxExperience: Int!
    $requiredEducation: String
    $domain: String
    $description: String
  ) {
    createJobRequirement(
      title: $title
      requiredSkills: $requiredSkills
      skillIds: $skillIds
      minExperience: $minExperience
      maxExperience: $maxExperience
      requiredEducation: $requiredEducation
      domain: $domain
      description: $description
    ) {
      id
      title
      requiredSkills
      skills {
        id
        name
        category
      }
      minExperienceYears
      maxExperienceYears
      requiredEducation
      domainRequirements
      description
      isActive
      createdAt
    }
  }
`

export const UPDATE_JOB = `
  mutation UpdateJob(
    $id: UUID!
    $title: String
    $requiredSkills: String
    $skillIds: [UUID!]
    $minExperience: Int
    $maxExperience: Int
    $requiredEducation: String
    $domain: String
    $description: String
    $isActive: Boolean
  ) {
    updateJobRequirement(
      id: $id
      title: $title
      requiredSkills: $requiredSkills
      skillIds: $skillIds
      minExperience: $minExperience
      maxExperience: $maxExperience
      requiredEducation: $requiredEducation
      domain: $domain
      description: $description
      isActive: $isActive
    ) {
      id
      title
      requiredSkills
      skills {
        id
        name
        category
      }
      minExperienceYears
      maxExperienceYears
      requiredEducation
      domainRequirements
      description
      isActive
      createdAt
    }
  }
`

export const DELETE_JOB = `
  mutation DeleteJob($id: UUID!) {
    deleteJobRequirement(id: $id)
  }
`

export const UPDATE_CANDIDATE = `
  mutation UpdateCandidate(
    $id: UUID!
    $name: String
    $email: String
    $mobile: String
    $skills: String
    $experience: Int
    $education: String
    $currentCompany: String
  ) {
    updateCandidate(
      id: $id
      name: $name
      email: $email
      mobile: $mobile
      skills: $skills
      experience: $experience
      education: $education
      currentCompany: $currentCompany
    ) {
      id
      name
      email
      mobile
      skills
      experience
      education
      currentCompany
      summary
      createdAt
    }
  }
`

export const DELETE_CANDIDATE = `
  mutation DeleteCandidate($id: UUID!) {
    deleteCandidate(id: $id)
  }
`

export const MATCH_CANDIDATE_TO_JOB = `
  mutation MatchCandidateToJob($candidateId: UUID!, $jobRequirementId: UUID!) {
    matchCandidateToJob(candidateId: $candidateId, jobRequirementId: $jobRequirementId) {
      id
      candidate { id }
      jobRequirement { id }
      matchScore
      skillsScore
      experienceScore
      educationScore
      domainScore
      matchExplanation
      isShortlisted
      isSelected
      createdAt
    }
  }
`

export const MATCH_ALL_CANDIDATES_TO_JOB = `
  mutation MatchAllCandidatesToJob($jobRequirementId: UUID!) {
    matchAllCandidatesToJob(jobRequirementId: $jobRequirementId) {
      id
      candidate { id }
      jobRequirement { id }
      matchScore
      skillsScore
      experienceScore
      educationScore
      domainScore
      matchExplanation
      isShortlisted
      isSelected
      createdAt
    }
  }
`

export const UPDATE_MATCH_STATUS = `
  mutation UpdateCandidateMatch(
    $matchId: UUID!
    $input: UpdateCandidateMatchInput!
  ) {
    updateCandidateMatch(
      matchId: $matchId
      input: $input
    ) {
      id
      candidate { id }
      jobRequirement { id }
      matchScore
      skillsScore
      experienceScore
      educationScore
      domainScore
      matchExplanation
      isShortlisted
      isSelected
      createdAt
    }
  }
`

// Skill Queries
export const GET_ALL_SKILLS = `
  query {
    allSkills {
      id
      name
      category
      description
      isActive
      createdAt
      updatedAt
    }
  }
`

export const SEARCH_SKILLS = `
  query SearchSkills($name: String!) {
    searchSkills(name: $name) {
      id
      name
      category
      description
      isActive
    }
  }
`

export const GET_ACTIVE_SKILLS = `
  query {
    activeSkills {
      id
      name
      category
      description
    }
  }
`

export const CREATE_SKILL = `
  mutation CreateSkill($name: String!, $category: String, $description: String) {
    createSkill(name: $name, category: $category, description: $description) {
      id
      name
      category
      description
      isActive
      createdAt
      updatedAt
    }
  }
`

export const UPDATE_SKILL = `
  mutation UpdateSkill($id: UUID!, $name: String, $category: String, $description: String, $isActive: Boolean) {
    updateSkill(id: $id, name: $name, category: $category, description: $description, isActive: $isActive) {
      id
      name
      category
      description
      isActive
      createdAt
      updatedAt
    }
  }
`

export const DELETE_SKILL = `
  mutation DeleteSkill($id: UUID!) {
    deleteSkill(id: $id)
  }
`

export const GET_RECENT_TRACKERS = `
  query GetRecentTrackers($hours: Int!) {
    recentProcessTrackers(hours: $hours) {
      id
      status
      totalFiles
      processedFiles
      failedFiles
      message
      uploadedFilename
      createdAt
      updatedAt
      completedAt
    }
  }
`
