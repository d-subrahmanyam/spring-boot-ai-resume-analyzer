import { GraphQLClient } from 'graphql-request'

const endpoint = window.location.origin + '/graphql'

export const graphqlClient = new GraphQLClient(endpoint, {
  headers: {
    'Content-Type': 'application/json',
  },
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
      experience
      education
      currentCompany
      summary
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
      experience
      education
      currentCompany
      summary
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
      experience
      education
      currentCompany
      summary
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
  query MatchesForJob($jobId: UUID!, $limit: Int) {
    matchesForJob(jobId: $jobId, limit: $limit) {
      id
      candidateId
      jobRequirementId
      matchScore
      skillsScore
      experienceScore
      educationScore
      domainScore
      explanation
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
  mutation MatchCandidateToJob($candidateId: UUID!, $jobId: UUID!) {
    matchCandidateToJob(candidateId: $candidateId, jobId: $jobId) {
      id
      candidateId
      jobRequirementId
      matchScore
      skillsScore
      experienceScore
      educationScore
      domainScore
      explanation
      isShortlisted
      isSelected
      createdAt
    }
  }
`

export const MATCH_ALL_CANDIDATES_TO_JOB = `
  mutation MatchAllCandidatesToJob($jobId: UUID!) {
    matchAllCandidatesToJob(jobId: $jobId) {
      id
      candidateId
      jobRequirementId
      matchScore
      skillsScore
      experienceScore
      educationScore
      domainScore
      explanation
      isShortlisted
      isSelected
      createdAt
    }
  }
`

export const UPDATE_MATCH_STATUS = `
  mutation UpdateMatchStatus(
    $matchId: UUID!
    $isShortlisted: Boolean
    $isSelected: Boolean
  ) {
    updateMatchStatus(
      matchId: $matchId
      isShortlisted: $isShortlisted
      isSelected: $isSelected
    ) {
      id
      candidateId
      jobRequirementId
      matchScore
      skillsScore
      experienceScore
      educationScore
      domainScore
      explanation
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
