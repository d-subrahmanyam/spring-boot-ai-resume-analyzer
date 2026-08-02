import { axiosInstance } from './axiosInstance'

export interface UploadResponse {
  trackerId: string
  message: string
}

export interface ProcessStatusResponse {
  id: string
  status: string
  totalFiles: number
  processedFiles: number
  failedFiles: number
  startTime: string
  endTime?: string
  message?: string
}

export interface JobQueueStats {
  pendingCount: number
  processingCount: number
  completedCount: number
  failedCount: number
  cancelledCount: number
  queueDepth: number
  averageProcessingDuration: number
  activeWorkers: number
  jobStatsByStatus: Record<string, number>
}

export const uploadResumes = async (files: File[]): Promise<UploadResponse> => {
  const formData = new FormData()
  files.forEach((file) => {
    formData.append('files', file)
  })

  const response = await axiosInstance.post<UploadResponse>('/api/upload/resume', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return response.data
}

export const getProcessStatus = async (trackerId: string): Promise<ProcessStatusResponse> => {
  const response = await axiosInstance.get<ProcessStatusResponse>(`/api/upload/status/${trackerId}`)
  return response.data
}

/**
 * Open a Server-Sent Events stream of live processing status.
 *
 * Uses a relative URL so it flows through the Vite dev proxy / nginx, avoiding
 * CORS.  The JWT is passed as a query parameter because the browser EventSource
 * API cannot set Authorization headers.
 */
export const openTrackerEventSource = (): EventSource => {
  const token = localStorage.getItem('accessToken') || ''
  return new EventSource(`/api/upload/status/events?token=${encodeURIComponent(token)}`)
}

export const getJobQueueStats = async (): Promise<JobQueueStats> => {
  const response = await axiosInstance.get<JobQueueStats>('/api/jobs/stats')
  return response.data
}
