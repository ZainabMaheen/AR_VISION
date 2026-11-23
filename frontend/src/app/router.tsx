import { createBrowserRouter } from 'react-router-dom'
import DashboardLayout from './layouts/DashboardLayout'
import DashboardPage from '../pages/DashboardPage'
import ARRoomPreviewPage from '../pages/ARRoomPreviewPage'
import MaterialCataloguePage from '../pages/MaterialCataloguePage'
import ComparePage from '../pages/ComparePage'
import FavouritesPage from '../pages/FavouritesPage'
import ScanHistoryPage from '../pages/ScanHistoryPage'
import ProjectsPage from '../pages/ProjectsPage'
import ProjectDetailPage from '../pages/ProjectDetailPage'
import SettingsPage from '../pages/SettingsPage'
import BusinessLayout from './layouts/BusinessLayout'
import BusinessDashboardPage from '../pages/business/BusinessDashboardPage'
import StockManagerPage from '../pages/business/StockManagerPage'
import BusinessSettingsPage from '../pages/business/BusinessSettingsPage'
import CartPage from '../pages/CartPage'
import CheckoutPage from '../pages/CheckoutPage'
import OrderSuccessPage from '../pages/OrderSuccessPage'
import NotFoundPage from '../pages/NotFoundPage'
import EnquiriesPage from '../pages/business/EnquiriesPage'
import EnquiryDetailPage from '../pages/business/EnquiryDetailPage'
import ErrorBoundary from '../components/common/ErrorBoundary'
import AuthLayout from './layouts/AuthLayout'
import LoginPage from '../pages/LoginPage'
import ProtectedRoute from '../features/auth/components/ProtectedRoute'

export const router = createBrowserRouter([
  {
    element: <DashboardLayout />,
    errorElement: <ErrorBoundary />,
    children: [
      { path: '/', element: <DashboardPage /> },
      { path: '/arpreview', element: <ARRoomPreviewPage /> },
      { path: '/catalogue', element: <MaterialCataloguePage /> },
      { path: '/compare', element: <ComparePage /> },
      { path: '/favourites', element: <FavouritesPage /> },
      {
        path: '/scans',
        element: (
          <ProtectedRoute title="Sign in to see your saved visualisations" message="Your saved visualisations are kept in your account, so you can open them on any device.">
            <ScanHistoryPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/projects',
        element: (
          <ProtectedRoute title="Sign in to see your projects" message="Projects group your saved visualisations by room. Sign in or create a free account to use them.">
            <ProjectsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/projects/:projectId',
        element: (
          <ProtectedRoute title="Sign in to see this project">
            <ProjectDetailPage />
          </ProtectedRoute>
        ),
      },
      { path: '/settings', element: <SettingsPage /> },
      { path: '/quote', element: <CartPage /> },
      { path: '/checkout', element: <CheckoutPage /> },
      { path: '/request-sent/:enquiryId', element: <OrderSuccessPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
  {
    path: '/business',
    element: (
      <ProtectedRoute role="business" fullScreen>
        <BusinessLayout />
      </ProtectedRoute>
    ),
    errorElement: <ErrorBoundary />,
    children: [
      { index: true, element: <BusinessDashboardPage /> },
      { path: 'stock', element: <StockManagerPage /> },
      { path: 'settings', element: <BusinessSettingsPage /> },
      { path: 'enquiries', element: <EnquiriesPage /> },
      { path: 'enquiries/:enquiryId', element: <EnquiryDetailPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
  {
    element: <AuthLayout />,
    errorElement: <ErrorBoundary />,
    children: [{ path: '/login', element: <LoginPage /> }],
  },
])