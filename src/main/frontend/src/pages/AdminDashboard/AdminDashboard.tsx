/**
 * Admin Dashboard Page
 * Displays system health, user statistics, and quick stats
 */

import { useState, useEffect, useCallback } from 'react'
import { graphqlClient } from '@/services/graphql'
import { ADMIN_DASHBOARD_DATA, MATCH_AUDITS_QUERY } from '@/graphql/adminQueries'
import styles from './AdminDashboard.module.css'

// Types for the dashboard data
interface SystemHealth {
  id: string
  serviceName: string
  status: string
  responseTimeMs?: number
  message?: string
  lastCheckedAt: string
  lastSuccessAt?: string
  lastFailureAt?: string
  failureCount: number
}

interface UserStatistics {
  total: number
  active: number
  admins: number
  recruiters: number
  hr: number
  hiringManagers: number
}

interface DepartmentCount {
  department: string
  count: number
}

interface EmploymentTypeCount {
  employmentType: string
  count: number
}

interface EmployeeStatistics {
  total: number
  active: number
  onLeave: number
  suspended: number
  terminated: number
  byDepartment: DepartmentCount[]
  byEmploymentType: EmploymentTypeCount[]
}

interface DashboardData {
  systemHealthReport: SystemHealth[]
  overallSystemStatus: string
  userStatistics: UserStatistics
  employeeStatistics: EmployeeStatistics
}

interface MatchAudit {
  id: string
  jobRequirementId: string
  jobTitle: string
  totalCandidates: number
  successfulMatches: number
  shortlistedCount: number
  averageMatchScore?: number
  highestMatchScore?: number
  durationMs?: number
  estimatedTokensUsed?: number
  status: string
  initiatedBy?: string
  errorMessage?: string
  initiatedAt: string
  completedAt?: string
}

// Service status icon mapping
const getStatusIcon = (status: string) => {
  switch (status) {
    case 'UP':
    case 'HEALTHY':
      return '✓'
    case 'DOWN':
    case 'UNHEALTHY':
      return '✗'
    case 'DEGRADED':
      return '⚠'
    default:
      return '?'
  }
}

// Service status class mapping
const getStatusClass = (status: string) => {
  switch (status) {
    case 'UP':
    case 'HEALTHY':
      return styles.statusHealthy
    case 'DOWN':
    case 'UNHEALTHY':
      return styles.statusUnhealthy
    case 'DEGRADED':
      return styles.statusDegraded
    default:
      return styles.statusUnknown
  }
}

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<DashboardData | null>(null)
  const [matchAudits, setMatchAudits] = useState<MatchAudit[]>([])
  const [auditsLoading, setAuditsLoading] = useState(false)

  const fetchDashboardData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await graphqlClient.request<DashboardData>(ADMIN_DASHBOARD_DATA)
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchMatchAudits = useCallback(async () => {
    setAuditsLoading(true)
    try {
      const result = await graphqlClient.request<{ matchAudits: MatchAudit[] }>(MATCH_AUDITS_QUERY)
      setMatchAudits(result.matchAudits ?? [])
    } catch {
      // non-critical — silently fail
    } finally {
      setAuditsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDashboardData()
    fetchMatchAudits()
    
    // Poll every 30 seconds
    const interval = setInterval(() => {
      fetchDashboardData()
      fetchMatchAudits()
    }, 30000)
    return () => clearInterval(interval)
  }, [fetchDashboardData, fetchMatchAudits])

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <h2>Error Loading Dashboard</h2>
          <p>{error}</p>
          <button onClick={fetchDashboardData} className={styles.retryButton}>
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!data) {
    return null
  }

  const { systemHealthReport, overallSystemStatus, userStatistics, employeeStatistics } = data

  const formatDuration = (ms?: number) => {
    if (!ms) return '—'
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(1)}s`
  }

  const formatScore = (score?: number) => (score != null ? `${score.toFixed(1)}%` : '—')

  const getAuditStatusClass = (status: string) => {
    switch (status) {
      case 'COMPLETED':  return styles.auditCompleted
      case 'IN_PROGRESS': return styles.auditInProgress
      case 'FAILED':     return styles.auditFailed
      default:           return ''
    }
  }

  const getAuditStatusLabel = (status: string) => {
    switch (status) {
      case 'COMPLETED':  return '✓ Completed'
      case 'IN_PROGRESS': return '⟳ In Progress'
      case 'FAILED':     return '✗ Failed'
      default:           return status
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Admin Dashboard</h1>
        <button onClick={fetchDashboardData} className={styles.refreshButton}>
          🔄 Refresh
        </button>
      </div>

      {/* Overall System Status */}
      <div className={`${styles.overallStatus} ${getStatusClass(overallSystemStatus)}`}>
        <span className={styles.statusIcon}>{getStatusIcon(overallSystemStatus)}</span>
        <span className={styles.statusText}>System Status: {overallSystemStatus}</span>
      </div>

      {/* System Health Services */}
      <section className={styles.section}>
        <h2>System Health</h2>
        <div className={styles.healthGrid}>
          {systemHealthReport.map((service: SystemHealth) => (
            <div key={service.id} className={styles.healthCard}>
              <div className={styles.healthCardHeader}>
                <span className={styles.serviceName}>{service.serviceName}</span>
                <span className={`${styles.serviceStatus} ${getStatusClass(service.status)}`}>
                  {getStatusIcon(service.status)} {service.status}
                </span>
              </div>
              <div className={styles.healthCardBody}>
                {service.responseTimeMs && (
                  <div className={styles.healthMetric}>
                    <span className={styles.metricLabel}>Response Time:</span>
                    <span className={styles.metricValue}>{service.responseTimeMs}ms</span>
                  </div>
                )}
                {service.message && (
                  <div className={styles.healthMetric}>
                    <span className={styles.metricLabel}>Message:</span>
                    <span className={styles.metricValue}>{service.message}</span>
                  </div>
                )}
                <div className={styles.healthMetric}>
                  <span className={styles.metricLabel}>Last Checked:</span>
                  <span className={styles.metricValue}>
                    {new Date(service.lastCheckedAt).toLocaleString()}
                  </span>
                </div>
                {service.failureCount > 0 && (
                  <div className={styles.healthMetric}>
                    <span className={styles.metricLabel}>Failures:</span>
                    <span className={styles.metricValue}>{service.failureCount}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Statistics Grid */}
      <div className={styles.statsGrid}>
        {/* User Statistics */}
        <section className={styles.statsCard}>
          <h2>User Statistics</h2>
          <div className={styles.statsContent}>
            <div className={styles.statRow}>
              <span className={styles.statLabel}>Total Users:</span>
              <span className={styles.statValue}>{userStatistics.total}</span>
            </div>
            <div className={styles.statRow}>
              <span className={styles.statLabel}>Active Users:</span>
              <span className={styles.statValue}>{userStatistics.active}</span>
            </div>
            <div className={styles.statDivider}></div>
            <div className={styles.statRow}>
              <span className={styles.statLabel}>Admins:</span>
              <span className={styles.statValue}>{userStatistics.admins}</span>
            </div>
            <div className={styles.statRow}>
              <span className={styles.statLabel}>Recruiters:</span>
              <span className={styles.statValue}>{userStatistics.recruiters}</span>
            </div>
            <div className={styles.statRow}>
              <span className={styles.statLabel}>HR:</span>
              <span className={styles.statValue}>{userStatistics.hr}</span>
            </div>
            <div className={styles.statRow}>
              <span className={styles.statLabel}>Hiring Managers:</span>
              <span className={styles.statValue}>{userStatistics.hiringManagers}</span>
            </div>
          </div>
        </section>

        {/* Employee Statistics */}
        <section className={styles.statsCard}>
          <h2>Employee Statistics</h2>
          <div className={styles.statsContent}>
            <div className={styles.statRow}>
              <span className={styles.statLabel}>Total Employees:</span>
              <span className={styles.statValue}>{employeeStatistics.total}</span>
            </div>
            <div className={styles.statDivider}></div>
            <div className={styles.statRow}>
              <span className={styles.statLabel}>Active:</span>
              <span className={styles.statValue}>{employeeStatistics.active}</span>
            </div>
            <div className={styles.statRow}>
              <span className={styles.statLabel}>On Leave:</span>
              <span className={styles.statValue}>{employeeStatistics.onLeave}</span>
            </div>
            <div className={styles.statRow}>
              <span className={styles.statLabel}>Suspended:</span>
              <span className={styles.statValue}>{employeeStatistics.suspended}</span>
            </div>
            <div className={styles.statRow}>
              <span className={styles.statLabel}>Terminated:</span>
              <span className={styles.statValue}>{employeeStatistics.terminated}</span>
            </div>
          </div>
        </section>

        {/* Department Breakdown */}
        <section className={styles.statsCard}>
          <h2>Departments</h2>
          <div className={styles.statsContent}>
            {employeeStatistics.byDepartment.map((dept: DepartmentCount) => (
              <div key={dept.department} className={styles.statRow}>
                <span className={styles.statLabel}>{dept.department}:</span>
                <span className={styles.statValue}>{dept.count}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Employment Type Breakdown */}
        <section className={styles.statsCard}>
          <h2>Employment Types</h2>
          <div className={styles.statsContent}>
            {employeeStatistics.byEmploymentType.map((type: EmploymentTypeCount) => (
              <div key={type.employmentType} className={styles.statRow}>
                <span className={styles.statLabel}>{type.employmentType}:</span>
                <span className={styles.statValue}>{type.count}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* ── Match Runs Audit Panel ─────────────────────────────── */}
      <section className={styles.auditSection}>
        <div className={styles.auditHeader}>
          <h2>🎯 Candidate Match Runs</h2>
          <button
            onClick={fetchMatchAudits}
            className={styles.refreshButton}
            title="Refresh match audits"
          >
            🔄 Refresh
          </button>
        </div>

        {auditsLoading && (
          <div className={styles.auditLoading}>Loading match audits…</div>
        )}

        {!auditsLoading && matchAudits.length === 0 && (
          <div className={styles.auditEmpty}>
            No match runs recorded yet. Run a candidate match to see audit data here.
          </div>
        )}

        {!auditsLoading && matchAudits.length > 0 && (
          <div className={styles.auditTableWrapper}>
            <table className={styles.auditTable}>
              <thead>
                <tr>
                  <th>Job Title</th>
                  <th>Status</th>
                  <th>Candidates</th>
                  <th>Shortlisted</th>
                  <th>Avg Score</th>
                  <th>Top Score</th>
                  <th>Duration</th>
                  <th>Est. Tokens</th>
                  <th>Initiated By</th>
                  <th>Initiated At</th>
                  <th>Completed At</th>
                </tr>
              </thead>
              <tbody>
                {matchAudits.map((audit) => (
                  <tr key={audit.id}>
                    <td className={styles.auditJobTitle}>{audit.jobTitle || '—'}</td>
                    <td>
                      <span className={`${styles.auditStatus} ${getAuditStatusClass(audit.status)}`}>
                        {getAuditStatusLabel(audit.status)}
                      </span>
                    </td>
                    <td className={styles.auditNum}>{audit.totalCandidates}</td>
                    <td className={styles.auditNum}>{audit.shortlistedCount}</td>
                    <td className={styles.auditNum}>{formatScore(audit.averageMatchScore)}</td>
                    <td className={styles.auditNum}>{formatScore(audit.highestMatchScore)}</td>
                    <td className={styles.auditNum}>{formatDuration(audit.durationMs)}</td>
                    <td className={styles.auditNum}>
                      {audit.estimatedTokensUsed != null
                        ? audit.estimatedTokensUsed.toLocaleString()
                        : '—'}
                    </td>
                    <td>{audit.initiatedBy || '—'}</td>
                    <td className={styles.auditDate}>
                      {new Date(audit.initiatedAt).toLocaleString()}
                    </td>
                    <td className={styles.auditDate}>
                      {audit.completedAt
                        ? new Date(audit.completedAt).toLocaleString()
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
