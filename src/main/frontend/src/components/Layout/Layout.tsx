import { Outlet, NavLink } from 'react-router-dom'
import styles from './Layout.module.css'

const Layout = () => {
  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <h1>🎯 Resume Analyzer</h1>
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
          <NavLink
            to="/upload"
            className={({ isActive }) =>
              isActive ? `${styles.navLink} ${styles.active}` : styles.navLink
            }
          >
            Upload Resumes
          </NavLink>
          <NavLink
            to="/candidates"
            className={({ isActive }) =>
              isActive ? `${styles.navLink} ${styles.active}` : styles.navLink
            }
          >
            Candidates
          </NavLink>
          <NavLink
            to="/jobs"
            className={({ isActive }) =>
              isActive ? `${styles.navLink} ${styles.active}` : styles.navLink
            }
          >
            Job Requirements
          </NavLink>
          <NavLink
            to="/matching"
            className={({ isActive }) =>
              isActive ? `${styles.navLink} ${styles.active}` : styles.navLink
            }
          >
            Candidate Matching
          </NavLink>
          <NavLink
            to="/skills"
            className={({ isActive }) =>
              isActive ? `${styles.navLink} ${styles.active}` : styles.navLink
            }
          >
            Skills Master
          </NavLink>
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
