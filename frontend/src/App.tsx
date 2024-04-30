import { AuthProvider } from "./contexts/AuthContext";

import HomePage from "./components/HomePage";
import LoginPage from "./components/LoginPage";
import SecuredRoute from "./components/SecuredRoute";
import OtherPage from "./components/admin-page-components/OtherPage";
import AdminPage from "./components/admin-page-components/AdminPage";
import TokenPage from "./components/admin-page-components/TokenPage";
import AnnouncePage from "./components/admin-page-components/AnnouncePage";
import EventListPage from "./components/admin-page-components/EventListPage";
import OperatorPage from "./components/operator-page-components/OperatorPage";
import FindUserPage from "./components/operator-page-components/FindUserPage";
import EventCreatePage from "./components/admin-page-components/EventCreatePage";
import EventPage from "./components/admin-page-components/event-page-components/EventPage";
import ServicePage from "./components/admin-page-components/event-page-components/ServicePage";
import EventInfoPage from "./components/admin-page-components/event-page-components/EventInfoPage";
import EventStatusPage from "./components/admin-page-components/event-page-components/EventStatusPage";
import NotificationPage from "./components/admin-page-components/event-page-components/NotificationPage";
import DrawPage from "./components/admin-page-components/event-page-components/draw-page-components/DrawPage";
import EventFileUploadPage from "./components/admin-page-components/event-page-components/EventFileUploadPage";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />

            {/* Admin pages */}

            <Route
              path="/admin"
              element={
                <SecuredRoute allowedRoles={["admin"]}>
                  <AdminPage />
                </SecuredRoute>
              }
            />

            <Route
              path="/admin/token"
              element={
                <SecuredRoute allowedRoles={["admin"]}>
                  <TokenPage />
                </SecuredRoute>
              }
            />

            <Route
              path="/admin/other"
              element={
                <SecuredRoute allowedRoles={["admin"]}>
                  <OtherPage />
                </SecuredRoute>
              }
            />

            <Route
              path="/admin/announce"
              element={
                <SecuredRoute allowedRoles={["admin"]}>
                  <AnnouncePage />
                </SecuredRoute>
              }
            />

            <Route
              path="/admin/events"
              element={
                <SecuredRoute allowedRoles={["admin"]}>
                  <EventListPage />
                </SecuredRoute>
              }
            />
            <Route
              path="/admin/events/create"
              element={
                <SecuredRoute allowedRoles={["admin"]}>
                  <EventCreatePage />
                </SecuredRoute>
              }
            />
            <Route
              path="/admin/events/:eventId"
              element={
                <SecuredRoute allowedRoles={["admin"]}>
                  <EventPage />
                </SecuredRoute>
              }
            />

            <Route
              path="/admin/events/:eventId/info"
              element={
                <SecuredRoute allowedRoles={["admin"]}>
                  <EventInfoPage />
                </SecuredRoute>
              }
            />

            <Route
              path="/admin/events/:eventId/notification"
              element={
                <SecuredRoute allowedRoles={["admin"]}>
                  <NotificationPage />
                </SecuredRoute>
              }
            />

            <Route
              path="/admin/events/:eventId/status"
              element={
                <SecuredRoute allowedRoles={["admin"]}>
                  <EventStatusPage />
                </SecuredRoute>
              }
            />

            <Route
              path="/admin/events/:eventId/draw"
              element={
                <SecuredRoute allowedRoles={["admin"]}>
                  <DrawPage />
                </SecuredRoute>
              }
            />

            <Route
              path="/admin/events/:eventId/file"
              element={
                <SecuredRoute allowedRoles={["admin"]}>
                  <EventFileUploadPage />
                </SecuredRoute>
              }
            />

            <Route
              path="/admin/events/:eventId/service"
              element={
                <SecuredRoute allowedRoles={["admin"]}>
                  <ServicePage />
                </SecuredRoute>
              }
            />

            {/* Operator pages */}

            <Route
              path="/operator"
              element={
                <SecuredRoute allowedRoles={["admin", "operator"]}>
                  <OperatorPage />
                </SecuredRoute>
              }
            />

            <Route
              path="/operator/find"
              element={
                <SecuredRoute allowedRoles={["admin", "operator"]}>
                  <FindUserPage />
                </SecuredRoute>
              }
            />

            <Route path="*" element={<div>Not Found</div>} />
          </Routes>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
