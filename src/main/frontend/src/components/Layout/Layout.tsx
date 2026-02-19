import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { logout } from '@store/slices/authSlice'
import {
  selectUser,
  selectUserFullName,
  selectUserRole,
  selectIsAdmin,
  selectCanManageEmployees,
  selectCanUploadResumes,
  selectCanManageJobs,
} from '@store/selectors/authSelectors'
import styles from './Layout.module.css'

const Layout = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const user = useSelector(selectUser)
  const fullName = useSelector(selectUserFullName)
  const userRole = useSelector(selectUserRole)
  const isAdmin = useSelector(selectIsAdmin)
  const canManageEmployees = useSelector(selectCanManageEmployees)
  const canUploadResumes = useSelector(selectCanUploadResumes)
  const canManageJobs = useSelector(selectCanManageJobs)

  const handleLogout = () => {
    dispatch(logout())
    navigate('/login')
  }

  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1>🎯 Resume Analyzer</h1>
          {user && (
            <div className={styles.userInfo}>
              <span className={styles.userName}>{fullName}</span>
              <span className={styles.userRole}>{userRole}</span>
              <button onClick={handleLogout} className={styles.logoutButton}>
                Logout
              </button>
            </div>
          )}
        </div>
        <nav className={styles.nav}>
          <NavLink
            to="/"
            className={({ isActive }) =>
              isActive ? `${styles.navLink} ${styles.active}` : styles.navLink
            }
            end
          >
            Dashboard
          </NavLink>
          {isAdmin && (
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                isActive ? `${styles.navLink} ${styles.active}` : styles.navLink
              }
            >
              Admin Dashboard
            </NavLink>
          )}
          {isAdmin && (
            <NavLink
              to="/users"
              className={({ isActive }) =>
                isActive ? `${styles.navLink} ${styles.active}` : styles.navLink
              }
            >
              User Management
            </NavLink>
          )}
          {canManageEmployees && (
            <NavLink
              to="/employees"
              className={({ isActive }) =>
                isActive ? `${styles.navLink} ${styles.active}` : styles.navLink
              }
            >
              Employee Management
            </NavLink>
          )}
          {canUploadResumes && (
            <NavLink
              to="/upload"
              className={({ isActive }) =>
                isActive ? `${styles.navLink} ${styles.active}` : styles.navLink
              }
            >
              Upload Resumes
            </NavLink>
          )}
          <NavLink
            to="/candidates"
            className={({ isActive }) =>
              isActive ? `${styles.navLink} ${styles.active}` : styles.navLink
            }
          >
            Candidates
          </NavLink>
          {canManageJobs && (
            <NavLink
              to="/jobs"
              className={({ isActive }) =>
                isActive ? `${styles.navLink} ${styles.active}` : styles.navLink
              }
            >
              Job Requirements
            </NavLink>
          )}
          <NavLink
            to="/matching"
            className={({ isActive }) =>
              isActive ? `${styles.navLink} ${styles.active}` : styles.navLink
            }
          >
            Candidate Matching
          </NavLink>
          {isAdmin && (
            <NavLink
              to="/skills"
              className={({ isActive }) =>
                isActive ? `${styles.navLink} ${styles.active}` : styles.navLink
              }
            >
              Skills Master
            </NavLink>
          )}
        </nav>
      </header>
      <main className={styles.main}>
        <Outlet />
      </main>
      <footer className={styles.footer}>
        <p>Resume Analyzer - AI-Powered Candidate Matching System © 2025</p>
      </footer>
    </div>
  )
}

export default Layout
