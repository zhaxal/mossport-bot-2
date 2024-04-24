import { AuthProvider } from "./contexts/AuthContext";

import HomePage from "./components/HomePage";
import LoginPage from "./components/LoginPage";
import SecuredRoute from "./components/SecuredRoute";
import AdminPage from "./components/admin-page-components/AdminPage";
import EventListPage from "./components/admin-page-components/EventListPage";
import OperatorPage from "./components/operator-page-components/OperatorPage";
import EventCreatePage from "./components/admin-page-components/EventCreatePage";
import EventPage from "./components/admin-page-components/event-page-components/EventPage";
import EventInfoPage from "./components/admin-page-components/event-page-components/EventInfoPage";
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
              path="/admin/events/:eventId/file"
              element={
                <SecuredRoute allowedRoles={["admin"]}>
                  <EventFileUploadPage />
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

            <Route path="*" element={<div>Not Found</div>} />
          </Routes>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
