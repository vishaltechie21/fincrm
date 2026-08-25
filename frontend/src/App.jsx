import React, { useState, useEffect } from 'react';
import CompanyMaster from './pages/CompanyMaster/CompanyMaster';
import ContactMaster from './pages/ContactMaster/ContactMaster';
import './App.css';

const menuGroups = [
  {
    title: 'Overview',
    items: [
      { id: 'dashboard', icon: '📊', label: 'Dashboard' },
      { id: 'notifications', icon: '🔔', label: 'Notifications' }
    ]
  },
  {
    title: 'CRM Master',
    items: [
      { id: 'company', icon: '🏢', label: 'Company Master' },
      { id: 'contact', icon: '👤', label: 'Contact Master' }
    ]
  },
  {
    title: 'Sales & Leads',
    items: [
      { id: 'enquiry', icon: '📥', label: 'Enquiry Register' },
      { id: 'demo', icon: '🖥️', label: 'Demo Management' },
      { id: 'followup', icon: '📅', label: 'Follow-up' }
    ]
  }
];

const allModules = menuGroups.flatMap(group => group.items.map(item => ({
  id: item.id,
  label: item.label,
  icon: item.icon,
  group: group.title
})));

function App() {
  const [pathname, setPathname] = useState(window.location.pathname);
  const [isBwTheme, setIsBwTheme] = useState(() => {
    const saved = localStorage.getItem('theme-bw');
    return saved === 'true';
  });

  const getInitialTabs = () => {
    const path = window.location.pathname;
    if (path === '/contact' || path === '/contact-master') {
      return [{ id: 'contact', label: 'Contact Master', icon: '👤' }];
    }
    if (path === '/' || path === '/company' || path === '/company-master') {
      return [{ id: 'company', label: 'Company Master', icon: '💼' }];
    }
    const cleanId = path.replace(/^\//, '');
    const found = allModules.find(m => m.id === cleanId);
    if (found) {
      return [{ id: found.id, label: found.label, icon: found.icon }];
    }
    return [{ id: 'company', label: 'Company Master', icon: '💼' }];
  };

  const [openTabs, setOpenTabs] = useState(getInitialTabs);
  const [globalSearch, setGlobalSearch] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Notifications State & Seeding (matches reference mockup)
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifSearch, setNotifSearch] = useState('');
  const [notifFilter, setNotifFilter] = useState('All');
  const [notifications, setNotifications] = useState([
    { id: 1, title: 'FINAMAN assigned you: please do ur work', desc: 'FINAMAN assigned you: please do ur work', time: '4 days ago', category: 'System', unread: true },
    { id: 2, title: 'Work diary submitted', desc: 'Suman submitted work diary for 2026-07-07 ...', time: '2 months ago', category: 'System', unread: true, action: 'Open →' },
    { id: 3, title: 'Work diary submitted', desc: 'FINAMAN submitted work diary for 2026-07-...', time: '2 months ago', category: 'System', unread: true },
    { id: 4, title: 'Work diary submitted', desc: 'Soumya submitted work diary for 2026-07-0...', time: '2 months ago', category: 'System', unread: true }
  ]);

  useEffect(() => {
    const handlePopState = () => {
      setPathname(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    if (isBwTheme) {
      document.documentElement.classList.add('theme-bw');
    } else {
      document.documentElement.classList.remove('theme-bw');
    }
    localStorage.setItem('theme-bw', isBwTheme);
  }, [isBwTheme]);

  const navigateTo = (path) => {
    window.history.pushState({}, '', path);
    setPathname(path);
  };

  const getActiveMenu = () => {
    if (pathname === '/contact' || pathname === '/contact-master') return 'contact';
    if (pathname === '/company' || pathname === '/company-master' || pathname === '/') return 'company';
    return pathname.replace(/^\//, '') || 'company';
  };

  const activeMenu = getActiveMenu();

  // Sync active page selection to openTabs array
  useEffect(() => {
    const selectedItem = allModules.find(item => item.id === activeMenu);
    if (selectedItem) {
      const exists = openTabs.some(t => t.id === selectedItem.id);
      if (!exists) {
        setOpenTabs(prev => [...prev, { id: selectedItem.id, label: selectedItem.label, icon: selectedItem.icon }]);
      }
    }
  }, [activeMenu]);

  // Shortcut Ctrl+K global focus listener & Escape key down
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.querySelector('.top-search-input');
        if (searchInput) searchInput.focus();
      }
      if (e.key === 'Escape') {
        setIsSearchFocused(false);
        setShowNotifications(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Notifications click-outside listener
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (showNotifications && !e.target.closest('.top-notification-wrapper')) {
        setShowNotifications(false);
      }
    };
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, [showNotifications]);

  const handleMenuClick = (menuId) => {
    const item = allModules.find(m => m.id === menuId);
    if (item) {
      const exists = openTabs.some(t => t.id === menuId);
      if (!exists) {
        setOpenTabs(prev => [...prev, { id: item.id, label: item.label, icon: item.icon }]);
      }
    }

    if (menuId === 'company') {
      navigateTo('/company');
    } else if (menuId === 'contact') {
      navigateTo('/contact');
    } else {
      navigateTo(`/${menuId}`);
    }
  };

  const handleCloseTab = (e, tabId) => {
    e.stopPropagation();
    if (openTabs.length === 1) return;
    const newTabs = openTabs.filter(tab => tab.id !== tabId);
    setOpenTabs(newTabs);
    if (activeMenu === tabId) {
      const index = openTabs.findIndex(tab => tab.id === tabId);
      const fallbackTab = newTabs[index - 1] || newTabs[0];
      if (fallbackTab) {
        handleMenuClick(fallbackTab.id);
      }
    }
  };

  const handleMarkAsDone = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleMarkAllAsDone = () => {
    setNotifications([]);
  };

  const filteredModules = globalSearch
    ? allModules.filter(m => m.label.toLowerCase().includes(globalSearch.toLowerCase()))
    : [];

  const filteredNotifications = notifications.filter(n => {
    if (notifFilter === 'Unread' && !n.unread) return false;
    if (notifFilter === 'System' && n.category !== 'System') return false;
    if (notifSearch) {
      const q = notifSearch.toLowerCase();
      return n.title.toLowerCase().includes(q) || n.desc.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="app-container">
      {/* Top Header spans 100% width */}
      <header className="top-nav">
        <div className="top-nav-left">
          <div className="logo-text">
            <img src="https://i0.wp.com/fincrm.com/wp-content/uploads/2023/03/FinCRM-Logo.png?w=753&ssl=1" alt="FinCRM Logo" />
          </div>
        </div>

        <div className="top-nav-center">
          <div className="top-company-title">LOGIX INFOTECH LLP</div>
          <div className="top-company-meta">Noida, UP | FY 2026-27</div>
        </div>

        <div className="top-nav-right">
          <div className="top-search-wrapper">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              className="top-search-input"
              placeholder="Search... (Ctrl+K)"
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setTimeout(() => setIsSearchFocused(false), 250)}
            />
            {isSearchFocused && filteredModules.length > 0 && (
              <div className="global-search-dropdown">
                {filteredModules.map((mod) => (
                  <div
                    key={mod.id}
                    className="global-search-item"
                    onMouseDown={() => {
                      handleMenuClick(mod.id);
                      setGlobalSearch('');
                    }}
                  >
                    <span className="search-item-icon">{mod.icon}</span>
                    <div className="search-item-info">
                      <span className="search-item-label">{mod.label}</span>
                      <span className="search-item-group">{mod.group}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Interactive Notifications Wrapper */}
          <div className="top-notification-wrapper">
            <div
              className={`top-notification-bell ${showNotifications ? 'active' : ''}`}
              onClick={() => setShowNotifications(!showNotifications)}
              title="Notifications"
            >
              <span className="bell-icon">🔔</span>
              {notifications.length > 0 && <span className="bell-badge">{notifications.length}</span>}
            </div>

            {showNotifications && (
              <div className="notifications-dropdown">
                <div className="notif-header">
                  <div className="notif-header-left">
                    <span className="notif-header-bell">🔔</span>
                    <h4>NOTIFICATIONS</h4>
                  </div>
                  <div className="notif-header-actions">
                    <button type="button" className="notif-action-btn" title="Refresh">🔄</button>
                    <button type="button" className="notif-action-btn" title="Toggle Sound">🔊</button>
                    <button type="button" className="notif-action-btn" onClick={handleMarkAllAsDone} title="Mark All as Done">✓✓</button>
                    <button type="button" className="notif-action-btn" onClick={handleMarkAllAsDone} title="Clear All">🗑️</button>
                  </div>
                </div>

                <div className="notif-search-container">
                  <span className="notif-search-icon">🔍</span>
                  <input
                    type="text"
                    className="notif-search-input"
                    placeholder="Search notifications..."
                    value={notifSearch}
                    onChange={(e) => setNotifSearch(e.target.value)}
                  />
                </div>

                <div className="notif-filters">
                  {['All', 'Unread', 'System'].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      className={`notif-filter-pill ${notifFilter === tag ? 'active' : ''}`}
                      onClick={() => setNotifFilter(tag)}
                    >
                      {tag}
                    </button>
                  ))}
                </div>

                <div className="notif-scroll-area">
                  {filteredNotifications.length === 0 ? (
                    <div className="notif-empty-state">
                      <p>No notifications found</p>
                    </div>
                  ) : (
                    filteredNotifications.map((n) => (
                      <div key={n.id} className="notif-item">
                        <div className="notif-item-left">
                          <span className="notif-info-icon">ⓘ</span>
                        </div>
                        <div className="notif-item-body">
                          <div className="notif-item-title-row">
                            <h5>{n.title}</h5>
                            <button
                              type="button"
                              className="notif-close-btn"
                              onClick={() => handleMarkAsDone(n.id)}
                              title="Mark as done"
                            >
                              &times;
                            </button>
                          </div>
                          <p>{n.desc}</p>
                          <div className="notif-item-footer">
                            <span className="notif-time">{n.time}</span>
                            <span className="notif-category">{n.category}</span>
                            {n.action && (
                              <span className="notif-action-link" onClick={handleMarkAllAsDone}>
                                {n.action}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="notif-footer" onClick={handleMarkAllAsDone}>
                  <span>View all notifications &rarr;</span>
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            className="theme-toggle-btn"
            onClick={() => setIsBwTheme((prev) => !prev)}
            title={isBwTheme ? 'Switch to Default Theme' : 'Switch to Contrast B&W Theme'}
          >
            {isBwTheme ? '☀️' : '🌓'}
          </button>

          <div className="top-profile-pill">
            <span className="profile-initial">V</span>
            <span className="profile-name">VISHAL</span>
          </div>
        </div>
      </header>

      {/* Main Body holds Sidebar and Scrollable Content */}
      <div className="app-body">
        <aside className="sidebar">
          <nav className="nav-menu">
            {menuGroups.map((group) => (
              <div key={group.title} className="menu-group">
                <span className="group-title">{group.title}</span>
                <ul className="group-items">
                  {group.items.map((item) => (
                    <li key={item.id}>
                      <button
                        type="button"
                        className={`nav-item ${activeMenu === item.id ? 'active' : ''}`}
                        onClick={() => handleMenuClick(item.id)}
                      >
                        <span className="nav-icon">{item.icon}</span>
                        <span className="nav-label">{item.label}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </aside>

        <div className="content-container">
          {/* Navigation Tabs Bar inside Main Content */}
          <div className="content-tabs-bar">
            {openTabs.map((tab) => (
              <div
                key={tab.id}
                className={`tab-item ${activeMenu === tab.id ? 'active' : ''}`}
                onClick={() => handleMenuClick(tab.id)}
              >
                <span>{tab.icon} {tab.label}</span>
                {openTabs.length > 1 && (
                  <button
                    type="button"
                    className="tab-close-btn"
                    onClick={(e) => handleCloseTab(e, tab.id)}
                    title="Close tab"
                  >
                    &times;
                  </button>
                )}
                {activeMenu === tab.id && <span className="tab-indicator-dot"></span>}
              </div>
            ))}
          </div>

          <main className="main-content">
            {activeMenu === 'company' ? (
              <CompanyMaster />
            ) : activeMenu === 'contact' ? (
              <ContactMaster />
            ) : (
              <div className="dummy-page">
                <div className="dummy-card">
                  <h2>{activeMenu.charAt(0).toUpperCase() + activeMenu.slice(1)} Module</h2>
                  <p>This is a placeholder page for the CRM module. Currently, only the <strong>Company Master</strong> is fully active for this phase.</p>
                  <button className="btn btn-primary" onClick={() => navigateTo('/company')}>
                    Go to Company Master
                  </button>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

export default App;
