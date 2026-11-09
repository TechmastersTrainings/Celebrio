import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { HomePage } from './pages/customer/HomePage';
import { CatalogPage } from './pages/customer/CatalogPage';
import { OrderWizardPage } from './pages/customer/OrderWizardPage';
import { OrderTrackingPage } from './pages/customer/OrderTrackingPage';
import { PreviewReviewPage } from './pages/customer/PreviewReviewPage';
import { DeliverablesPage } from './pages/customer/DeliverablesPage';
import { DeveloperWorkspacePage } from './pages/workspace/DeveloperWorkspacePage';
import { DeveloperAuthPage } from './pages/workspace/DeveloperAuthPage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { PublicInvitationPage } from './pages/public/PublicInvitationPage';

export const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<string>('home');
  const [selectedOccasionId, setSelectedOccasionId] = useState<string>('');
  const [selectedPackageId, setSelectedPackageId] = useState<string>('');
  const [activeOrderRef, setActiveOrderRef] = useState<string>('');
  const [activePreviewToken, setActivePreviewToken] = useState<string>('');
  const [publicSlug, setPublicSlug] = useState<string>('');
  const [staffUser, setStaffUser] = useState<any | null>(null);

  useEffect(() => {
    // Check if URL is a direct public invitation: /invite/:slug
    const pathname = window.location.pathname;
    if (pathname.startsWith('/invite/')) {
      const slug = pathname.replace('/invite/', '').replace('/', '');
      if (slug) {
        setPublicSlug(slug);
        setCurrentView('public-invite');
        return;
      }
    }

    // Check staff session
    const savedUser = localStorage.getItem('celebrio_staff_user');
    if (savedUser) {
      try {
        setStaffUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('celebrio_staff_user');
      }
    }
  }, []);

  const handleNavigate = (view: string, param?: string) => {
    setCurrentView(view);
    if (param) {
      if (view === 'tracking') setActiveOrderRef(param);
      if (view === 'preview') setActivePreviewToken(param);
      if (view === 'deliverables') setActiveOrderRef(param);
      if (view === 'public-invite') setPublicSlug(param);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogout = () => {
    localStorage.removeItem('celebrio_staff_token');
    localStorage.removeItem('celebrio_staff_user');
    setStaffUser(null);
    setCurrentView('catalog');
  };

  // If in public invitation mode, render unbranded viewer without main application navbar
  if (currentView === 'public-invite') {
    return <PublicInvitationPage slug={publicSlug} />;
  }

  return (
    <div className="app-container">
      <Navbar
        currentView={currentView}
        onNavigate={handleNavigate}
        staffUser={staffUser}
        onLogout={handleLogout}
      />

      <main className="main-content">
        {currentView === 'home' && (
          <HomePage
            onSelectOccasion={(occId, pkgId) => {
              setSelectedOccasionId(occId);
              if (pkgId) setSelectedPackageId(pkgId);
              setCurrentView('wizard');
            }}
            onNavigate={handleNavigate}
          />
        )}

        {currentView === 'catalog' && (
          <CatalogPage
            onSelectPackage={(occId, pkgId) => {
              setSelectedOccasionId(occId);
              setSelectedPackageId(pkgId);
              setCurrentView('wizard');
            }}
            onTrackOrder={() => setCurrentView('tracking')}
          />
        )}

        {currentView === 'wizard' && (
          <OrderWizardPage
            initialOccasionId={selectedOccasionId}
            initialPackageId={selectedPackageId}
            onOrderCreated={(ref) => {
              setActiveOrderRef(ref);
              setCurrentView('tracking');
            }}
            onCancel={() => setCurrentView('catalog')}
          />
        )}

        {currentView === 'tracking' && (
          <OrderTrackingPage
            initialOrderRef={activeOrderRef}
            onOpenPreview={(previewUrl) => {
              const token = previewUrl.replace('/preview/', '');
              setActivePreviewToken(token);
              setCurrentView('preview');
            }}
            onOpenDeliverables={(orderRef) => {
              setActiveOrderRef(orderRef);
              setCurrentView('deliverables');
            }}
          />
        )}

        {currentView === 'preview' && (
          <PreviewReviewPage
            previewToken={activePreviewToken}
            onBack={() => setCurrentView('tracking')}
            onApprove={(orderRef) => {
              setActiveOrderRef(orderRef);
              setCurrentView('tracking');
            }}
            onRequestRevision={(orderRef) => {
              setActiveOrderRef(orderRef);
              setCurrentView('tracking');
            }}
          />
        )}

        {currentView === 'deliverables' && (
          <DeliverablesPage
            orderRef={activeOrderRef}
            onBack={() => setCurrentView('tracking')}
            onOpenPublicLink={(slug) => {
              setPublicSlug(slug);
              setCurrentView('public-invite');
            }}
          />
        )}

        {currentView === 'dev-auth' && (
          <DeveloperAuthPage
            onLoginSuccess={(user) => {
              setStaffUser(user);
              if (user.is_admin) {
                setCurrentView('admin');
              } else {
                setCurrentView('workspace');
              }
            }}
          />
        )}

        {currentView === 'workspace' && staffUser && (
          <DeveloperWorkspacePage
            currentUser={staffUser}
            onOpenPreview={(previewUrl) => {
              const token = previewUrl.replace('/preview/', '');
              setActivePreviewToken(token);
              setCurrentView('preview');
            }}
          />
        )}

        {currentView === 'admin' && staffUser?.is_admin && (
          <AdminDashboardPage />
        )}
      </main>

      <Footer />
    </div>
  );
};

export default App;

