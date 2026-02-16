import { all, call, put, takeLatest, takeEvery } from 'redux-saga/effects'
import { PayloadAction } from '@reduxjs/toolkit'
import { graphqlClient, 
  GET_ALL_CANDIDATES, 
  SEARCH_CANDIDATES_BY_NAME, 
  SEARCH_CANDIDATES_BY_SKILL,
  UPDATE_CANDIDATE,
  DELETE_CANDIDATE,
  GET_ALL_JOBS,
  CREATE_JOB,
  UPDATE_JOB,
  DELETE_JOB,
  GET_MATCHES_FOR_JOB,
  MATCH_CANDIDATE_TO_JOB,
  MATCH_ALL_CANDIDATES_TO_JOB,
  UPDATE_MATCH_STATUS,
} from '@services/graphql'
import { uploadResumes, getProcessStatus } from '@services/api'
import * as candidatesActions from '@store/slices/candidatesSlice'
import * as jobsActions from '@store/slices/jobsSlice'
import * as matchesActions from '@store/slices/matchesSlice'
import * as uploadActions from '@store/slices/uploadSlice'
import type { Candidate } from '@store/slices/candidatesSlice'
import type { JobRequirement } from '@store/slices/jobsSlice'
import type { CandidateMatch } from '@store/slices/matchesSlice'
import type { ProcessTracker } from '@store/slices/uploadSlice'

// Helper to call graphql client (wrapper to fix TypeScript/redux-saga type issues)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const gqlRequest = (query: any, variables?: any) => graphqlClient.request(query, variables)

// Candidate Sagas
function* fetchCandidatesSaga() {
  try {
    const data: { allCandidates: Candidate[] } = yield call(
      gqlRequest,
      GET_ALL_CANDIDATES
    )
    yield put(candidatesActions.fetchCandidatesSuccess(data.allCandidates))
  } catch (error: any) {
    yield put(candidatesActions.fetchCandidatesFailure(error.message))
  }
}

function* searchCandidatesByNameSaga(action: PayloadAction<string>) {
  try {
    const data: { searchCandidatesByName: Candidate[] } = yield call(
      gqlRequest,
      SEARCH_CANDIDATES_BY_NAME,
      { name: action.payload }
    )
    yield put(candidatesActions.fetchCandidatesSuccess(data.searchCandidatesByName))
  } catch (error: any) {
    yield put(candidatesActions.fetchCandidatesFailure(error.message))
  }
}

function* searchCandidatesBySkillSaga(action: PayloadAction<string>) {
  try {
    const data: { searchCandidatesBySkill: Candidate[] } = yield call(
      gqlRequest,
      SEARCH_CANDIDATES_BY_SKILL,
      { skill: action.payload }
    )
    yield put(candidatesActions.fetchCandidatesSuccess(data.searchCandidatesBySkill))
  } catch (error: any) {
    yield put(candidatesActions.fetchCandidatesFailure(error.message))
  }
}

function* updateCandidateSaga(action: PayloadAction<Candidate>) {
  try {
    const data: { updateCandidate: Candidate } = yield call(
      gqlRequest,
      UPDATE_CANDIDATE,
      action.payload
    )
    yield put(candidatesActions.updateCandidateSuccess(data.updateCandidate))
  } catch (error: any) {
    yield put(candidatesActions.fetchCandidatesFailure(error.message))
  }
}

function* deleteCandidateSaga(action: PayloadAction<string>) {
  try {
    yield call(gqlRequest, DELETE_CANDIDATE, { id: action.payload })
    yield put(candidatesActions.deleteCandidateSuccess(action.payload))
  } catch (error: any) {
    yield put(candidatesActions.fetchCandidatesFailure(error.message))
  }
}

// Job Sagas
function* fetchJobsSaga() {
  try {
    const data: { allJobRequirements: JobRequirement[] } = yield call(
      gqlRequest,
      GET_ALL_JOBS
    )
    yield put(jobsActions.fetchJobsSuccess(data.allJobRequirements))
  } catch (error: any) {
    yield put(jobsActions.fetchJobsFailure(error.message))
  }
}

function* createJobSaga(action: PayloadAction<Omit<JobRequirement, 'id' | 'createdAt'>>) {
  try {
    const data: { createJobRequirement: JobRequirement } = yield call(
      gqlRequest,
      CREATE_JOB,
      action.payload
    )
    yield put(jobsActions.createJobSuccess(data.createJobRequirement))
  } catch (error: any) {
    yield put(jobsActions.fetchJobsFailure(error.message))
  }
}

function* updateJobSaga(action: PayloadAction<JobRequirement>) {
  try {
    const data: { updateJobRequirement: JobRequirement } = yield call(
      gqlRequest,
      UPDATE_JOB,
      action.payload
    )
    yield put(jobsActions.updateJobSuccess(data.updateJobRequirement))
  } catch (error: any) {
    yield put(jobsActions.fetchJobsFailure(error.message))
  }
}

function* deleteJobSaga(action: PayloadAction<string>) {
  try {
    yield call(gqlRequest, DELETE_JOB, { id: action.payload })
    yield put(jobsActions.deleteJobSuccess(action.payload))
  } catch (error: any) {
    yield put(jobsActions.fetchJobsFailure(error.message))
  }
}

// Matching Sagas
function* fetchMatchesForJobSaga(
  action: PayloadAction<{ jobId: string; limit?: number }>
) {
  try {
    const data: { matchesForJob: CandidateMatch[] } = yield call(
      gqlRequest,
      GET_MATCHES_FOR_JOB,
      action.payload
    )
    yield put(matchesActions.fetchMatchesSuccess(data.matchesForJob))
  } catch (error: any) {
    yield put(matchesActions.fetchMatchesFailure(error.message))
  }
}

function* matchCandidateToJobSaga(
  action: PayloadAction<{ candidateId: string; jobId: string }>
) {
  try {
    const data: { matchCandidateToJob: CandidateMatch } = yield call(
      gqlRequest,
      MATCH_CANDIDATE_TO_JOB,
      action.payload
    )
    yield put(matchesActions.matchingSuccess(data.matchCandidateToJob))
  } catch (error: any) {
    yield put(matchesActions.matchingFailure(error.message))
  }
}

function* matchAllCandidatesToJobSaga(action: PayloadAction<string>) {
  try {
    const data: { matchAllCandidatesToJob: CandidateMatch[] } = yield call(
      gqlRequest,
      MATCH_ALL_CANDIDATES_TO_JOB,
      { jobId: action.payload }
    )
    yield put(matchesActions.matchingSuccess(data.matchAllCandidatesToJob))
  } catch (error: any) {
    yield put(matchesActions.matchingFailure(error.message))
  }
}

function* updateMatchStatusSaga(
  action: PayloadAction<{ matchId: string; isShortlisted?: boolean; isSelected?: boolean }>
) {
  try {
    const data: { updateMatchStatus: CandidateMatch } = yield call(
      gqlRequest,
      UPDATE_MATCH_STATUS,
      action.payload
    )
    yield put(matchesActions.updateMatchStatusSuccess(data.updateMatchStatus))
  } catch (error: any) {
    yield put(matchesActions.fetchMatchesFailure(error.message))
  }
}

// Upload Sagas
function* uploadFilesSaga(action: PayloadAction<File[]>) {
  try {
    const response: { trackerId: string; message: string } = yield call(
      uploadResumes,
      action.payload
    )
    const tracker: ProcessTracker = {
      id: response.trackerId,
      status: 'INITIATED',
      totalFiles: action.payload.length,
      processedFiles: 0,
      failedFiles: 0,
      startTime: new Date().toISOString(),
    }
    yield put(uploadActions.uploadSuccess(tracker))
  } catch (error: any) {
    yield put(uploadActions.uploadFailure(error.message))
  }
}

function* fetchProcessStatusSaga(action: PayloadAction<string>): Generator<any, void, ProcessTracker> {
  try {
    const status = yield call(getProcessStatus, action.payload)
    yield put(uploadActions.updateProcessStatus(status))
  } catch (error: any) {
    yield put(uploadActions.uploadFailure(error.message))
  }
}

// Root Saga
export default function* rootSaga() {
  yield all([
    takeLatest(candidatesActions.fetchCandidates.type, fetchCandidatesSaga),
    takeLatest(candidatesActions.searchCandidatesByName.type, searchCandidatesByNameSaga),
    takeLatest(candidatesActions.searchCandidatesBySkill.type, searchCandidatesBySkillSaga),
    takeEvery(candidatesActions.updateCandidate.type, updateCandidateSaga),
    takeEvery(candidatesActions.deleteCandidate.type, deleteCandidateSaga),
    takeLatest(jobsActions.fetchJobs.type, fetchJobsSaga),
    takeEvery(jobsActions.createJob.type, createJobSaga),
    takeEvery(jobsActions.updateJob.type, updateJobSaga),
    takeEvery(jobsActions.deleteJob.type, deleteJobSaga),
    takeLatest(matchesActions.fetchMatchesForJob.type, fetchMatchesForJobSaga),
    takeEvery(matchesActions.matchCandidateToJob.type, matchCandidateToJobSaga),
    takeEvery(matchesActions.matchAllCandidatesToJob.type, matchAllCandidatesToJobSaga),
    takeEvery(matchesActions.updateMatchStatus.type, updateMatchStatusSaga),
    takeEvery(uploadActions.uploadFiles.type, uploadFilesSaga),
    takeEvery(uploadActions.fetchProcessStatus.type, fetchProcessStatusSaga),
  ])
}
