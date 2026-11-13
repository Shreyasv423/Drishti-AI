import React from 'react';
import { DrishtiProvider, useDrishti } from './context/DrishtiContext';
import { Layout } from './components/Layout';
import { OnboardingPage } from './pages/OnboardingPage';
import { AuthPage } from './pages/AuthPage';
import { DashboardPage } from './pages/DashboardPage';
import { CameraAssistantPage } from './pages/CameraAssistantPage';
import { OcrReaderPage } from './pages/OcrReaderPage';
import { VoiceAssistantPage } from './pages/VoiceAssistantPage';
import { CurrencyPage } from './pages/CurrencyPage';
import { NavigationPage } from './pages/NavigationPage';
import { ObjectFinderPage } from './pages/ObjectFinderPage';
import { LearningAssistantPage } from './pages/LearningAssistantPage';
import { SosPage } from './pages/SosPage';
import { ToolsPage } from './pages/ToolsPage';
import { SettingsPage } from './pages/SettingsPage';
import { HelpPage } from './pages/HelpPage';

const ActiveRouteView: React.FC = () => {
  const { route } = useDrishti();

  switch (route) {
    case 'onboarding':
      return <OnboardingPage />;
    case 'auth':
      return <AuthPage />;
    case 'camera':
      return <CameraAssistantPage />;
    case 'ocr':
      return <OcrReaderPage />;
    case 'voice':
      return <VoiceAssistantPage />;
    case 'currency':
      return <CurrencyPage />;
    case 'navigation':
      return <NavigationPage />;
    case 'finder':
      return <ObjectFinderPage />;
    case 'learning':
      return <LearningAssistantPage />;
    case 'sos':
      return <SosPage />;
    case 'tools':
      return <ToolsPage />;
    case 'settings':
      return <SettingsPage />;
    case 'help':
      return <HelpPage />;
    case 'dashboard':
    default:
      return <DashboardPage />;
  }
};

export default function App() {
  return (
    <DrishtiProvider>
      <Layout>
        <ActiveRouteView />
      </Layout>
    </DrishtiProvider>
  );
}
