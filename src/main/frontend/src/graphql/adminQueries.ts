/**
 * GraphQL queries for Admin Dashboard
 */

/**
 * Query system health report
 */
export const SYSTEM_HEALTH_REPORT = `
  query {
    systemHealthReport {
      id
      serviceName
      status
      responseTimeMs
      message
      lastCheckedAt
      lastSuccessAt
      lastFailureAt
      failureCount
    }
    overallSystemStatus
  }
`

/**
 * Query user statistics
 */
export const USER_STATISTICS = `
  query {
    userStatistics {
      total
      active
      admins
      recruiters
      hr
      hiringManagers
    }
  }
`

/**
 * Query employee statistics
 */
export const EMPLOYEE_STATISTICS = `
  query {
    employeeStatistics {
      total
      active
      onLeave
      suspended
      terminated
      byDepartment {
        department
        count
      }
      byEmploymentType {
        employmentType
        count
      }
    }
  }
`

/**
 * Combined admin dashboard query
 */
export const ADMIN_DASHBOARD_DATA = `
  query {
    systemHealthReport {
      id
      serviceName
      status
      responseTimeMs
      message
      lastCheckedAt
      lastSuccessAt
      lastFailureAt
      failureCount
    }
    overallSystemStatus
    userStatistics {
      total
      active
      admins
      recruiters
      hr
      hiringManagers
    }
    employeeStatistics {
      total
      active
      onLeave
      suspended
      terminated
      byDepartment {
        department
        count
      }
      byEmploymentType {
        employmentType
        count
      }
    }
  }
`
