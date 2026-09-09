import { createBrowserRouter } from 'react-router-dom'
import ProtectedRoute from '@/components/ProtectedRoute'
import AdminLayout from '@/layouts/AdminLayout'

import LoginPage from '@/pages/LoginPage'
import DashboardPage from '@/pages/DashboardPage'
import ProductsPage from '@/pages/ProductsPage'
import CategoriesPage from '@/pages/CategoriesPage'
import OrdersPage from '@/pages/OrdersPage'
import UsersPage from '@/pages/UsersPage'
import HomepageCmsPage from '@/pages/HomepageCmsPage'
import ActivityVaultPage from '@/pages/ActivityVaultPage'
import BulkOrdersPage from '@/pages/BulkOrdersPage'
import AnalyticsPage from '@/pages/AnalyticsPage'
import PrintDocumentPage from '@/pages/PrintDocumentPage'
import DelhiveryLogisticsPage from '@/pages/DelhiveryLogisticsPage'

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/print/:type/:id',
    element: <PrintDocumentPage />,
  },
  {
    path: '/print/:type',
    element: <PrintDocumentPage />,
  },
  {
    path: '/print',
    element: <PrintDocumentPage />,
  },
  {
    path: '/',
    element: <ProtectedRoute />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { index: true, element: <DashboardPage /> },
          { path: 'analytics', element: <AnalyticsPage /> },
          { path: 'products', element: <ProductsPage /> },
          { path: 'categories', element: <CategoriesPage /> },
          { path: 'orders', element: <OrdersPage /> },
          { path: 'delhivery', element: <DelhiveryLogisticsPage /> },
          { path: 'ekart', element: <DelhiveryLogisticsPage /> },
          { path: 'bulk-orders', element: <BulkOrdersPage /> },
          { path: 'users', element: <UsersPage /> },
          { path: 'homepage-cms', element: <HomepageCmsPage /> },
          { path: 'activity-vault', element: <ActivityVaultPage /> },
        ],
      },
    ],
  },
])
