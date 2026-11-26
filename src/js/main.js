const { AppProvider, useApp } = window.LifeLink;
const { Header, Footer, ToastBanner, GlobalModal } = window.LifeLinkComponents;
const { HomePage, AboutPage, HowItWorksPage, SafetyFaqsPage } = window.LifeLinkPublicPages;
const { FindDonorsPage, CreateRequestPage, RequestTrackPage } = window.LifeLinkMatchingPages;
const { DonorDashboardPage, RecipientDashboardPage, DonorProfilePage } = window.LifeLinkDashboardPages;
const { ChatPage, PrivacySettingsPage, LoginPage, SignupPage } = window.LifeLinkAccountPages;
const { ProfilePage } = window.LifeLinkProfilePages || {};
const { SearchDonorsPage } = window.LifeLinkSearchPages || {};
const { RequestsPage } = window.LifeLinkRequestPages || {};

function RouterView() {
  const { route } = useApp();

  const renderPage = () => {
    switch (route) {
      case "/":
        return <HomePage />;
      case "/find-donors":
        return SearchDonorsPage ? <SearchDonorsPage /> : <FindDonorsPage />;
      case "/request-blood":
        return RequestsPage ? <RequestsPage /> : <CreateRequestPage />;
      case "/donor-dashboard":
        return <DonorDashboardPage />;
      case "/recipient-dashboard":
        return <RecipientDashboardPage />;
      case "/donor-profile":
        return <DonorProfilePage />;
      case "/request-track":
        return <RequestTrackPage />;
      case "/chat":
        return <ChatPage />;
      case "/how-it-works":
        return <HowItWorksPage />;
      case "/about":
        return <AboutPage />;
      case "/safety-faqs":
        return <SafetyFaqsPage />;
      case "/privacy-settings":
        return ProfilePage ? <ProfilePage /> : <PrivacySettingsPage />;
      case "/profile":
        return ProfilePage ? <ProfilePage /> : <PrivacySettingsPage />;
      case "/login":
        return <LoginPage />;
      case "/signup":
        return <SignupPage />;
      default:
        return <HomePage />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface text-text font-sans antialiased">
      <Header />
      <main className="flex-1 pt-20">{renderPage()}</main>
      <Footer />
      <ToastBanner />
      <GlobalModal />
    </div>
  );
}

const rootEl = document.getElementById("root");
const defaultRoute = rootEl?.dataset?.defaultRoute || "/";

ReactDOM.createRoot(rootEl).render(
  <AppProvider defaultRoute={defaultRoute}>
    <RouterView />
  </AppProvider>
);
