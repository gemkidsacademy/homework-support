import { useState } from 'react'
import HomeworkConfiguration from '../components/admin/HomeworkConfiguration'
import HomeworkWeeklyDashboard from '../components/admin/HomeworkWeeklyDashboard'
import HomeworkAutomation from '../components/admin/HomeworkAutomation'
import TestEmail from '../components/TestEmail'
const logoUrl = 'https://gemkidsacademy.com.au/wp-content/uploads/2024/11/Frame-1707478212.svg'

function AdminPanel({ loggedInUser }) {
  const [activeTab, setActiveTab] = useState('Home Work Configuration')

  const tabs = [
  'Home Work Configuration',
  'Weekly Dashboard',
  'Automation',
  'Test Email',
]

  return (
    <div className="admin-panel">
      <div className="admin-layout">
        <aside className="admin-sidebar" aria-label="Admin navigation">
          <div className="sidebar-brand">
            <img className="admin-logo" src={logoUrl} alt="Gem Kids Academy" />
            <div>
              <strong>Gem Kids Academy</strong>
              <span>Administration Portal</span>
            </div>
          </div>

          <nav className="sidebar-nav">
            <p className="sidebar-heading">Main</p>
            {tabs.map((tab, index) => (
              <button
                className={`sidebar-link${activeTab === tab ? ' active' : ''}`}
                type="button"
                role="tab"
                aria-selected={activeTab === tab}
                onClick={() => setActiveTab(tab)}
                key={tab}
              >
                <span className="sidebar-icon" aria-hidden="true">{['▦', '▤', '◈'][index]}</span>
                <span>{tab}</span>
              </button>
            ))}
          </nav>

          <div className="sidebar-footer">
            <span className="sidebar-footer-label">Signed in as</span>
            <strong>{loggedInUser?.username || 'Administrator'}</strong>
            {loggedInUser?.center_code && <span>{loggedInUser.center_code}</span>}
          </div>
        </aside>

        <div className="admin-content">
          <main className="admin-main">
            {activeTab === 'Home Work Configuration' ? (
              <HomeworkConfiguration loggedInUser={loggedInUser} />
            ) : activeTab === 'Weekly Dashboard' ? (
              <HomeworkWeeklyDashboard loggedInUser={loggedInUser} />
            ) : activeTab === 'Automation' ? (
              <HomeworkAutomation loggedInUser={loggedInUser} />
            ) : (
              <TestEmail loggedInUser={loggedInUser} />
            )}
          </main>
      </div>
    </div>
    </div>
  )
}

export default AdminPanel
