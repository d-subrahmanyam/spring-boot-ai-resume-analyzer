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

export const getJobQueueStats = async (): Promise<JobQueueStats> => {
  const response = await axiosInstance.get<JobQueueStats>('/api/jobs/stats')
  return response.data
}
