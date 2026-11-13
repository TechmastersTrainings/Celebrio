import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { HomePage } from './pages/customer/HomePage';
import { DesignsPage } from './pages/customer/DesignsPage';
import { CatalogPage } from './pages/customer/CatalogPage';
import { OrderWizardPage } from './pages/customer/OrderWizardPage';
import { OrderTrackingPage } from './pages/customer/OrderTrackingPage';
import { PreviewReviewPage } from './pages/customer/PreviewReviewPage';
import { DeliverablesPage } from './pages/customer/DeliverablesPage';
import { DeveloperWorkspacePage } from './pages/workspace/DeveloperWorkspacePage';
import { DeveloperAuthPage } from './pages/workspace/DeveloperAuthPage';
import { AdminAuthPage } from './pages/admin/AdminAuthPage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { PublicInvitationPage } from './pages/public/PublicInvitationPage';
import { OffersPage } from './pages/customer/OffersPage';

export const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<string>('home');
  const [selectedOccasionId, setSelectedOccasionId] = useState<string>('');
  const [selectedPackageId, setSelectedPackageId] = useState<string>('');
  const [activeOrderRef, setActiveOrderRef] = useState<string>('');
  const [activePreviewToken, setActivePreviewToken] = useState<string>('');
  const [publicSlug, setPublicSlug] = useState<string>('');
  const [staffUser, setStaffUser] = useState<any | null>(() => {
    try {
      const savedUser = localStorage.getItem('celebrio_staff_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  // Helper to map route view to standard URL
  const getViewUrl = (view: string, param?: string): string => {
    switch (view) {
      case 'home':
        return '/';
      case 'designs':
        return '/designs';
      case 'catalog':
        return '/catalog';
      case 'wizard':
        return '/wizard';
      case 'tracking':
        return param ? `/tracking?ref=${encodeURIComponent(param)}` : '/tracking';
      case 'preview':
        return `/preview/${param || activePreviewToken || ''}`;
      case 'deliverables':
        return `/deliverables/${param || activeOrderRef || ''}`;
      case 'public-invite':
        return `/invite/${param || publicSlug || ''}`;
      case 'dev-login':
        return '/developers/login';
      case 'workspace':
        return '/developers';
      case 'admin-login':
        return '/admin/login';
      case 'offers':
        return '/offers';
      case 'admin':
        return '/admin';
      default:
        return '/';
    }
  };

  // Route Resolver from window.location.pathname
  const resolveRoute = useCallback((userOverride?: any) => {
    const user = userOverride !== undefined ? userOverride : staffUser;
    const pathname = window.location.pathname;
    const search = window.location.search;

    // 1. Public Unbranded Invitation Experience: /invite/:slug
    if (pathname.startsWith('/invite/')) {
      const slug = pathname.replace('/invite/', '').replace('/', '');
      if (slug) {
        setPublicSlug(slug);
        setCurrentView('public-invite');
        return;
      }
    }

    // 2. Customer Preview Review: /preview/:token
    if (pathname.startsWith('/preview/')) {
      const token = pathname.replace('/preview/', '').replace('/', '');
      if (token) {
        setActivePreviewToken(token);
        setCurrentView('preview');
        return;
      }
    }

    // 3. Customer Deliverables Vault: /deliverables/:ref
    if (pathname.startsWith('/deliverables/')) {
      const ref = pathname.replace('/deliverables/', '').replace('/', '');
      if (ref) {
        setActiveOrderRef(ref);
        setCurrentView('deliverables');
        return;
      }
    }

    // 4. Developer Portal: /developers/login
    if (pathname === '/developers/login' || pathname === '/developers/login/') {
      if (user && (user.is_approved_developer || user.is_admin)) {
        // Authenticated user: navigate to workspace
        setCurrentView('workspace');
        window.history.replaceState({}, '', '/developers');
        return;
      }
      setCurrentView('dev-login');
      return;
    }

    // 5. Developer Portal Workspace: /developers or /developers/workspace
    if (pathname === '/developers' || pathname === '/developers/' || pathname === '/developers/workspace') {
      if (!user) {
        // Unauthenticated access -> redirect to developer login
        setCurrentView('dev-login');
        window.history.replaceState({}, '', '/developers/login');
        return;
      }
      setCurrentView('workspace');
      return;
    }

    // 6. Admin Portal: /admin/login (Strict Admin: techmastersinnovations@gmail.com)
    if (pathname === '/admin/login' || pathname === '/admin/login/') {
      const isActualAdmin = Boolean(user && user.email?.toLowerCase() === 'techmastersinnovations@gmail.com' && user.is_admin);
      if (isActualAdmin) {
        // Authenticated Admin: navigate to Admin Control Center
        setCurrentView('admin');
        window.history.replaceState({}, '', '/admin');
        return;
      }
      setCurrentView('admin-login');
      return;
    }

    // 7. Admin Portal Dashboard: /admin or /admin/dashboard
    if (pathname === '/admin' || pathname === '/admin/' || pathname === '/admin/dashboard') {
      const isActualAdmin = Boolean(user && user.email?.toLowerCase() === 'techmastersinnovations@gmail.com' && user.is_admin);
      if (!isActualAdmin) {
        // Non-admin attempting admin dashboard -> role protection
        if (user && user.is_approved_developer) {
          setCurrentView('workspace');
          window.history.replaceState({}, '', '/developers');
        } else {
          setCurrentView('admin-login');
          window.history.replaceState({}, '', '/admin/login');
        }
        return;
      }
      setCurrentView('admin');
      return;
    }

    // 8. Public Customer Portal Routes
    if (pathname === '/designs' || pathname === '/designs/') {
      setCurrentView('designs');
      return;
    }
    if (pathname === '/catalog' || pathname === '/catalog/') {
      setCurrentView('catalog');
      return;
    }
    if (pathname === '/wizard' || pathname === '/wizard/') {
      setCurrentView('wizard');
      return;
    }
    if (pathname === '/tracking' || pathname === '/tracking/') {
      const urlParams = new URLSearchParams(search);
      const refParam = urlParams.get('ref');
      if (refParam) setActiveOrderRef(refParam);
      setCurrentView('tracking');
      return;
    }
    if (pathname === '/offers' || pathname === '/offers/') {
      setCurrentView('offers');
      return;
    }

    // Default Customer Homepage
    setCurrentView('home');
  }, [staffUser]);

  // Initial mount route check & Popstate listener
  useEffect(() => {
    resolveRoute();

    const handlePopState = () => {
      resolveRoute();
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [resolveRoute]);

  // Scroll to top on view changes
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [currentView]);

  // Universal Navigation Handler with History Synchronization
  const handleNavigate = (view: string, param?: string, replaceUrl: boolean = false) => {
    let targetView = view;
    let targetParam = param;

    // Apply role guards
    if (view === 'workspace') {
      if (!staffUser) {
        targetView = 'dev-login';
      }
    } else if (view === 'admin') {
      if (!staffUser || !staffUser.is_admin) {
        targetView = 'admin-login';
      }
    }

    if (targetParam) {
      if (targetView === 'tracking') setActiveOrderRef(targetParam);
      if (targetView === 'preview') setActivePreviewToken(targetParam);
      if (targetView === 'deliverables') setActiveOrderRef(targetParam);
      if (targetView === 'public-invite') setPublicSlug(targetParam);
    }

    setCurrentView(targetView);

    const targetUrl = getViewUrl(targetView, targetParam);
    if (window.location.pathname + window.location.search !== targetUrl) {
      if (replaceUrl) {
        window.history.replaceState({}, '', targetUrl);
      } else {
        window.history.pushState({}, '', targetUrl);
      }
    }

    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  };

  // Staff Login Handlers
  const handleDevLoginSuccess = (user: any) => {
    setStaffUser(user);
    localStorage.setItem('celebrio_staff_user', JSON.stringify(user));

    if (user.is_admin) {
      // Admins can navigate to admin or supervise developer queue
      handleNavigate('workspace', undefined, true);
    } else {
      handleNavigate('workspace', undefined, true);
    }
  };

  const handleAdminLoginSuccess = (user: any) => {
    setStaffUser(user);
    localStorage.setItem('celebrio_staff_user', JSON.stringify(user));
    handleNavigate('admin', undefined, true);
  };

  // Logout Handler
  const handleLogout = () => {
    const wasAdmin = currentView === 'admin' || currentView === 'admin-login';
    const wasDev = currentView === 'workspace' || currentView === 'dev-login';

    localStorage.removeItem('celebrio_staff_token');
    localStorage.removeItem('celebrio_staff_user');
    setStaffUser(null);

    if (wasAdmin) {
      handleNavigate('admin-login', undefined, true);
    } else if (wasDev) {
      handleNavigate('dev-login', undefined, true);
    } else {
      handleNavigate('home', undefined, true);
    }
  };

  // If in public invitation mode, render isolated viewer without main application navbar
  if (currentView === 'public-invite') {
    return <PublicInvitationPage slug={publicSlug} />;
  }

  return (
    <div className="app-container">
      {/* Navbar rendered on all application pages */}
      <Navbar
        currentView={currentView}
        onNavigate={handleNavigate}
        staffUser={staffUser}
        onLogout={handleLogout}
      />

      <main className="main-content">
        {/* =========================================================================
            PORTAL 1: MAIN WEBSITE — CUSTOMER CELEBRATION PORTAL
            ========================================================================= */}
        {currentView === 'home' && (
          <HomePage
            onSelectOccasion={(occId, pkgId) => {
              setSelectedOccasionId(occId);
              if (pkgId) setSelectedPackageId(pkgId);
              handleNavigate('wizard');
            }}
            onNavigate={handleNavigate}
          />
        )}

        {currentView === 'designs' && (
          <DesignsPage
            onSelectDesign={(occId, pkgId) => {
              setSelectedOccasionId(occId);
              if (pkgId) setSelectedPackageId(pkgId);
              handleNavigate('wizard');
            }}
            onNavigate={handleNavigate}
          />
        )}

        {currentView === 'catalog' && (
          <CatalogPage
            onSelectPackage={(occId, pkgId) => {
              setSelectedOccasionId(occId);
              setSelectedPackageId(pkgId);
              handleNavigate('wizard');
            }}
            onTrackOrder={() => handleNavigate('tracking')}
          />
        )}

        {currentView === 'wizard' && (
          <OrderWizardPage
            initialOccasionId={selectedOccasionId}
            initialPackageId={selectedPackageId}
            onOrderCreated={(ref) => {
              setActiveOrderRef(ref);
              handleNavigate('tracking', ref);
            }}
            onCancel={() => handleNavigate('catalog')}
          />
        )}

        {currentView === 'tracking' && (
          <OrderTrackingPage
            initialOrderRef={activeOrderRef}
            onOpenPreview={(previewUrl) => {
              const token = previewUrl.replace('/preview/', '');
              setActivePreviewToken(token);
              handleNavigate('preview', token);
            }}
            onOpenDeliverables={(orderRef) => {
              setActiveOrderRef(orderRef);
              handleNavigate('deliverables', orderRef);
            }}
          />
        )}

        {currentView === 'preview' && (
          <PreviewReviewPage
            previewToken={activePreviewToken}
            onBack={() => handleNavigate('tracking')}
            onApprove={(orderRef) => {
              setActiveOrderRef(orderRef);
              handleNavigate('tracking', orderRef);
            }}
            onRequestRevision={(orderRef) => {
              setActiveOrderRef(orderRef);
              handleNavigate('tracking', orderRef);
            }}
          />
        )}

        {currentView === 'offers' && (
          <OffersPage onNavigate={handleNavigate} />
        )}

        {currentView === 'deliverables' && (
          <DeliverablesPage
            orderRef={activeOrderRef}
            onBack={() => handleNavigate('tracking')}
            onOpenPublicLink={(slug) => {
              setPublicSlug(slug);
              handleNavigate('public-invite', slug);
            }}
          />
        )}

        {/* =========================================================================
            PORTAL 2: DEVELOPER & ARTISAN PORTAL (URL: /developers/login & /developers)
            ========================================================================= */}
        {currentView === 'dev-login' && (
          <DeveloperAuthPage
            onLoginSuccess={handleDevLoginSuccess}
            onNavigate={handleNavigate}
          />
        )}

        {currentView === 'workspace' && staffUser && (
          <DeveloperWorkspacePage
            currentUser={staffUser}
            onOpenPreview={(previewUrl) => {
              const token = previewUrl.replace('/preview/', '');
              setActivePreviewToken(token);
              handleNavigate('preview', token);
            }}
          />
        )}

        {/* =========================================================================
            PORTAL 3: ADMIN SUPERMAN CONTROL CENTRE (URL: /admin/login & /admin)
            ========================================================================= */}
        {currentView === 'admin-login' && (
          <AdminAuthPage
            onLoginSuccess={handleAdminLoginSuccess}
            onNavigate={handleNavigate}
          />
        )}

        {currentView === 'admin' && staffUser?.is_admin && (
          <AdminDashboardPage />
        )}
      </main>

      {/* Public Footer is displayed on customer pages */}
      {['home', 'designs', 'catalog', 'tracking', 'offers'].includes(currentView) && (
        <Footer onNavigate={handleNavigate} />
      )}
    </div>
  );
};

export default App;
