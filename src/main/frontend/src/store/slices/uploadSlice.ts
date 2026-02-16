import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface ProcessTracker {
  id: string
  status: 'INITIATED' | 'EMBED_GENERATED' | 'VECTOR_DB_UPDATED' | 'RESUME_ANALYZED' | 'COMPLETED' | 'FAILED'
  totalFiles: number
  processedFiles: number
  failedFiles: number
  startTime: string
  endTime?: string
  errorMessage?: string
}

interface UploadState {
  uploading: boolean
  tracker: ProcessTracker | null
  error: string | null
}

const initialState: UploadState = {
  uploading: false,
  tracker: null,
  error: null,
}

const uploadSlice = createSlice({
  name: 'upload',
  initialState,
  reducers: {
    uploadFiles: (state, _action: PayloadAction<File[]>) => {
      state.uploading = true
      state.error = null
    },
    uploadSuccess: (state, action: PayloadAction<ProcessTracker>) => {
      state.tracker = action.payload
      state.uploading = false
    },
    uploadFailure: (state, action: PayloadAction<string>) => {
      state.error = action.payload
      state.uploading = false
    },
    fetchProcessStatus: (_state, _action: PayloadAction<string>) => {
      // Initiates saga to fetch status
    },
    updateProcessStatus: (state, action: PayloadAction<ProcessTracker>) => {
      state.tracker = action.payload
    },
    clearTracker: (state) => {
      state.tracker = null
      state.error = null
    },
  },
})

export const {
  uploadFiles,
  uploadSuccess,
  uploadFailure,
  fetchProcessStatus,
  updateProcessStatus,
  clearTracker,
} = uploadSlice.actions

export default uploadSlice.reducer
