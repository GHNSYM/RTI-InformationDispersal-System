import { Route } from 'react-router-dom';
import React, { lazy, Suspense } from 'react';

// Loading fallback for lazy-loaded components
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
  </div>
);

// Lazy load components
const Login = lazy(() => import('../pages/auth/Login'));
const Register = lazy(() => import('../pages/auth/Register'));
const LandingPage = lazy(() => import('../pages/LandingPage'));
const CitizenDashboard = lazy(() => import('../pages/citizen/dashboard'));
const CitizenRequests = lazy(() => import('../pages/citizen/Requests'));
const AdminDashboard = lazy(() => import('../pages/SPIO/AdminDashboard'));
const Departments = lazy(() => import('../pages/SPIO/Departments'));
const AdminRequests = lazy(() => import('../pages/SPIO/AdminRequests'));
const DepartmentDashboard = lazy(() => import('../pages/PIO/DepartmentDashboard'));
const SpioAssistantDashboard = lazy(() => import('../pages/SPIO/assistant/SpioAssistantDashboard'));
const StateAdminDashboard = lazy(() => import('../pages/StateAdmin/StateAdminDashboard'));
const SpioAssistants = lazy(() => import('../pages/SPIO/SpioAssistants'));

// Wrap components with Suspense
const withSuspense = (Component) => {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Component />
    </Suspense>
  );
};

const routes = [  
  <Route key="" path="/" element={withSuspense(LandingPage)} />,
  <Route key="landing" path="/" element={withSuspense(LandingPage)} />,
  <Route key="login" path="/login" element={withSuspense(Login)} />,
  <Route key="register" path="/register" element={withSuspense(Register)} />,
  <Route key="dashboard" path="/citizen" element={withSuspense(CitizenDashboard)} />,
  <Route key="requests" path="/requests" element={withSuspense(CitizenRequests)}/>,
  <Route key="admin" path="/admin" element={withSuspense(AdminDashboard)} />,
  <Route key="departments" path="/viewDepartments" element={withSuspense(Departments)} />,
  <Route key="adminRequests" path="/adminRequests" element={withSuspense(AdminRequests)} />,
  <Route key="department" path="/department" element={withSuspense(DepartmentDashboard)} />,
  <Route key="spio-assistant" path="/spio-assistant" element={withSuspense(SpioAssistantDashboard)} />,
  <Route key="state-admin" path="/state-admin" element={withSuspense(StateAdminDashboard)} />,
  <Route key="spio-assistants" path="/spio-assistants" element={withSuspense(SpioAssistants)} />,
];

export default routes;