/**
 * Admin Dashboard Page
 * Displays system health, user statistics, and quick stats
 */

import { useState, useEffect, useCallback } from 'react'
import { graphqlClient } from '@/services/graphql'
import { ADMIN_DASHBOARD_DATA } from '@/graphql/adminQueries'
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

  useEffect(() => {
    fetchDashboardData()
    
    // Poll every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000)
    return () => clearInterval(interval)
  }, [fetchDashboardData])

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
    </div>
  )
}
