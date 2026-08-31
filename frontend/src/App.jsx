/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useRef } from 'react';
import Swal from 'sweetalert2';
import { LayoutDashboard, Bell, Building2, User, Inbox, Monitor, Calendar, Search, RotateCw, Volume2, CheckCheck, Trash2, Sun, Moon, Info } from 'lucide-react';
import CompanyMaster from './pages/CompanyMaster/CompanyMaster';
import ContactMaster from './pages/ContactMaster/ContactMaster';
import CompanySearch from './pages/CompanySearch/CompanySearch';
import ContactSearch from './pages/ContactSearch/ContactSearch';
import './App.css';

const menuGroups = [
  {
    title: 'Overview',
    items: [
      { id: 'dashboard', icon: <LayoutDashboard size={14} />, label: 'Dashboard' },
      { id: 'notifications', icon: <Bell size={14} />, label: 'Notifications' }
    ]
  },
  {
    title: 'CRM Master',
    items: [
      { id: 'company', icon: <Building2 size={14} />, label: 'Company Master Entry' },
      { id: 'contact', icon: <User size={14} />, label: 'Contact Master Entry' },
      { id: 'company-search', icon: <Search size={14} />, label: 'Company Search' },
      { id: 'contact-search', icon: <Search size={14} />, label: 'Contact Search' }
    ]
  },
  {
    title: 'Sales & Leads',
    items: [
      { id: 'enquiry', icon: <Inbox size={14} />, label: 'Enquiry Register' },
      { id: 'demo', icon: <Monitor size={14} />, label: 'Demo Management' },
      { id: 'followup', icon: <Calendar size={14} />, label: 'Follow-up' }
    ]
  }
  , {
    title: 'CONFIGURATION',
    items: [
      { id: 'masters', icon: <User size={14} />, label: 'Sub Master Configuration' },
      { id: 'activity', icon: <Monitor size={14} />, label: 'Activity Log' }
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
  const companyMasterRef = useRef();
  const contactMasterRef = useRef();
  const [isFormDirty, setIsFormDirty] = useState(false);

  const [pathname, setPathname] = useState(window.location.pathname);
  const [isBwTheme, setIsBwTheme] = useState(() => {
    const saved = localStorage.getItem('theme-bw');
    return saved === 'true';
  });

  const getInitialTabs = () => {
    const path = window.location.pathname;
    if (path === '/contact' || path === '/contact-master') {
      return [{ id: 'contact', label: 'Contact Master Entry', icon: <User size={12} /> }];
    }
    if (path === '/' || path === '/company' || path === '/company-master') {
      return [{ id: 'company', label: 'Company Master Entry', icon: <Building2 size={12} /> }];
    }
    if (path === '/company-search') {
      return [{ id: 'company-search', label: 'Company Search', icon: <Search size={12} /> }];
    }
    if (path === '/contact-search') {
      return [{ id: 'contact-search', label: 'Contact Search', icon: <Search size={12} /> }];
    }
    const cleanId = path.replace(/^\//, '');
    const found = allModules.find(m => m.id === cleanId);
    if (found) {
      return [{ id: found.id, label: found.label, icon: found.icon }];
    }
    return [{ id: 'company', label: 'Company Master Entry', icon: <Building2 size={12} /> }];
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
    const handleBeforeUnload = (e) => {
      if (isFormDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isFormDirty]);

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
    if (pathname === '/company-search') return 'company-search';
    if (pathname === '/contact-search') return 'contact-search';
    return pathname.replace(/^\//, '') || 'company';
  };

  const activeMenu = getActiveMenu();

  // Sync active page selection to openTabs array
  useEffect(() => {
    const selectedItem = allModules.find(item => item.id === activeMenu);
    if (selectedItem) {
      setOpenTabs(prev => {
        const exists = prev.some(t => t.id === selectedItem.id);
        if (!exists) {
          return [...prev, { id: selectedItem.id, label: selectedItem.label, icon: selectedItem.icon }];
        }
        return prev;
      });
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

  const handleEditStateChange = (dirty) => {
    setIsFormDirty(dirty);
  };

  const handleMenuClick = async (menuId) => {
    if (menuId === activeMenu) return;

    if (isFormDirty) {
      const result = await Swal.fire({
        title: 'Unsaved Changes',
        text: 'You have unsaved changes in the form. What would you like to do?',
        icon: 'warning',
        showCancelButton: true,
        showDenyButton: true,
        confirmButtonText: 'Save & Leave',
        denyButtonText: 'Discard & Leave',
        cancelButtonText: 'Stay Here',
        confirmButtonColor: 'var(--btn-success)',
        denyButtonColor: 'var(--btn-danger)',
        cancelButtonColor: 'var(--border)',
        background: 'var(--panel)',
        color: 'var(--text-h)'
      });

      if (result.isConfirmed) {
        const activeRef = activeMenu === 'company' ? companyMasterRef.current : contactMasterRef.current;
        if (activeRef && activeRef.save) {
          const saveSuccess = await activeRef.save();
          if (saveSuccess) {
            setIsFormDirty(false);
            performNavigation(menuId);
          }
        }
      } else if (result.isDenied) {
        const activeRef = activeMenu === 'company' ? companyMasterRef.current : contactMasterRef.current;
        if (activeRef && activeRef.discard) {
          activeRef.discard();
        }
        setIsFormDirty(false);
        performNavigation(menuId);
      }
      return;
    }

    performNavigation(menuId);
  };

  const performNavigation = (menuId) => {
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
    } else if (menuId === 'company-search') {
      navigateTo('/company-search');
    } else if (menuId === 'contact-search') {
      navigateTo('/contact-search');
    } else {
      navigateTo(`/${menuId}`);
    }
  };

  const handleCloseTab = async (e, tabId) => {
    e.stopPropagation();
    if (openTabs.length === 1) return;

    if (tabId === activeMenu && isFormDirty) {
      const result = await Swal.fire({
        title: 'Unsaved Changes',
        text: 'You have unsaved changes in the form. What would you like to do?',
        icon: 'warning',
        showCancelButton: true,
        showDenyButton: true,
        confirmButtonText: 'Save & Close',
        denyButtonText: 'Discard & Close',
        cancelButtonText: 'Stay Here',
        confirmButtonColor: 'var(--btn-success)',
        denyButtonColor: 'var(--btn-danger)',
        cancelButtonColor: 'var(--border)',
        background: 'var(--panel)',
        color: 'var(--text-h)'
      });

      if (result.isConfirmed) {
        const activeRef = activeMenu === 'company' ? companyMasterRef.current : contactMasterRef.current;
        if (activeRef && activeRef.save) {
          const saveSuccess = await activeRef.save();
          if (saveSuccess) {
            setIsFormDirty(false);
            performCloseTab(tabId);
          }
        }
      } else if (result.isDenied) {
        const activeRef = activeMenu === 'company' ? companyMasterRef.current : contactMasterRef.current;
        if (activeRef && activeRef.discard) {
          activeRef.discard();
        }
        setIsFormDirty(false);
        performCloseTab(tabId);
      }
      return;
    }

    performCloseTab(tabId);
  };

  const performCloseTab = (tabId) => {
    const newTabs = openTabs.filter(tab => tab.id !== tabId);
    setOpenTabs(newTabs);
    if (activeMenu === tabId) {
      const index = openTabs.findIndex(tab => tab.id === tabId);
      const fallbackTab = newTabs[index - 1] || newTabs[0];
      if (fallbackTab) {
        performNavigation(fallbackTab.id);
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
            <img src="/logo.png" alt="FinCRM Logo" />
          </div>
        </div>

        <div className="top-nav-center">
          <div className="top-company-title">LOGIX INFOTECH LLP</div>
          <div className="top-company-meta">Noida, UP | FY 2026-27</div>
        </div>

        <div className="top-nav-right">
          <div className="top-search-wrapper">
            <span className="search-icon"><Search size={14} /></span>
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
              <span className="bell-icon"><Bell size={16} /></span>
              {notifications.length > 0 && <span className="bell-badge">{notifications.length}</span>}
            </div>

            {showNotifications && (
              <div className="notifications-dropdown">
                <div className="notif-header">
                  <div className="notif-header-left">
                    <span className="notif-header-bell"><Bell size={14} /></span>
                    <h4>NOTIFICATIONS</h4>
                  </div>
                  <div className="notif-header-actions">
                    <button type="button" className="notif-action-btn" title="Refresh"><RotateCw size={13} /></button>
                    <button type="button" className="notif-action-btn" title="Toggle Sound"><Volume2 size={13} /></button>
                    <button type="button" className="notif-action-btn" onClick={handleMarkAllAsDone} title="Mark All as Done"><CheckCheck size={13} /></button>
                    <button type="button" className="notif-action-btn" onClick={handleMarkAllAsDone} title="Clear All"><Trash2 size={13} /></button>
                  </div>
                </div>

                <div className="notif-search-container">
                  <span className="notif-search-icon"><Search size={13} /></span>
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
                          <span className="notif-info-icon"><Info size={14} /></span>
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
            {isBwTheme ? <Sun size={14} /> : <Moon size={14} />}
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
                <span>{tab.icon}{tab.label}</span>
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
              <CompanyMaster ref={companyMasterRef} onEditStateChange={handleEditStateChange} />
            ) : activeMenu === 'contact' ? (
              <ContactMaster ref={contactMasterRef} onEditStateChange={handleEditStateChange} />
            ) : activeMenu === 'company-search' ? (
              <CompanySearch />
            ) : activeMenu === 'contact-search' ? (
              <ContactSearch />
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
