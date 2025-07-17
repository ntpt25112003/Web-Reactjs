import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import { useState } from 'react'
// import reactLogo from './assets/react.svg'
// import viteLogo from '/vite.svg'
import './App.css'
import WelcomePage from './app/pages/welcome/WelcomePage'
import LoginPage from './app/pages/login/LoginPage'
import SettingPage from "./app/pages/settings/SettingPage";
import Dashboard from "./app/pages/settings/dashboard/Dashboard";
import Notify from "./app/pages/settings/notify/Notify";
import ProfilePage from "./app/pages/profile/ProfilePage";
import DevPage from "./app/pages/dev/DevPage";
import DevFormPage from "./app/pages/dev/form/DevForm";
import ReportPage from "./app/pages/dev/report/ReportPage";
import SegmentsPage from "./app/pages/segments/SegmentPage";
import FeaturePage from "./app/pages/feature/FeaturePage";
import DocumentPage from "./app/pages/documents/DocumentPage";
import ChatListPage from "./app/pages/operation/chat/list/ChatListPage";
import ChatDetailPage from "./app/pages/operation/chat/detail/ChatDetailPage";
import { ActionSheetProvider } from "./app/services/ActionSheetContext";
import DevApiPage from "./app/pages/dev/api/ApiPage";
import DevNativePage from "./app/pages/dev/native/NativePage";
import NotificationsPage from "./app/pages/notifications/NotificationsPage";
import ChatCreatePage from "./app/pages/operation/chat/create/ChatCreatePage";
import OtpPage from "./app/pages/dev/otp/OtpPage";

function App() {
  const [count, setCount] = useState(0)

  return (
    <ActionSheetProvider>
    <Router>
      <Routes>
        {/* Trang chính */}
        <Route path="/" element={<WelcomePage />} />
        
        {/* Dev routes */}
        <Route path="/dev" element={<DevPage />} />
        <Route path="/dev/login" element={<LoginPage />} />
        <Route path="/dev/otp" element={<OtpPage />} />
        <Route path="/dev/form" element={<DevFormPage />} />
        <Route path="/dev/report" element={<ReportPage />} />
        <Route path="/dev/api" element={<DevApiPage />} />
        <Route path="/dev/native" element={<DevNativePage />} />
        <Route path="notifications" element={<NotificationsPage />} />

        {/* Settings routes */}
        <Route path="/settings" element={<SettingPage />} />
        <Route path="/settings/dashboard" element={<Dashboard />} />
        <Route path="/settings/notify" element={<Notify />} />

        {/* Profile */}
        <Route path="/profile" element={<ProfilePage />} />

        <Route path="/segments" element={<SegmentsPage />} />
        <Route path="/feature" element={<FeaturePage />} />
        <Route path="/document" element={<DocumentPage />} />

        <Route path="/operation/chat" element={<ChatListPage />} />
        <Route path="/operation/chat/dtl" element={<ChatDetailPage />} />
        <Route path="/operation/chat/create" element={<ChatCreatePage />} />
      </Routes>
    </Router>
    </ActionSheetProvider>
  )
}

export default App
