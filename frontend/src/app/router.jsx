import { createBrowserRouter, Navigate } from 'react-router-dom'
import PublicLayout from '@/layouts/PublicLayout'
import AdminLayout from '@/admin-suite/layouts/AdminLayout'
import AdminRoute from '@/components/AdminRoute'

// Public Storefront Pages
import HomePage from '@/pages/HomePage'
import ShopPage from '@/pages/ShopPage'
import ProductDetailPage from '@/pages/ProductDetailPage'
import CheckoutPage from '@/pages/CheckoutPage'
import OrderSuccessPage from '@/pages/OrderSuccessPage'
import TrackOrderPage from '@/pages/TrackOrderPage'
import ContactUsPage from '@/pages/ContactUsPage'
import ShippingPolicyPage from '@/pages/ShippingPolicyPage'
import ReturnPolicyPage from '@/pages/ReturnPolicyPage'
import PrivacyPolicyPage from '@/pages/PrivacyPolicyPage'
import AboutUsPage from '@/pages/AboutUsPage'
import ProfessionalCarePage from '@/pages/ProfessionalCarePage'
import TermsOfServicePage from '@/pages/TermsOfServicePage'
import LoginPage from '@/pages/LoginPage'
import RegisterPage from '@/pages/RegisterPage'
import ForgotPasswordPage from '@/pages/ForgotPasswordPage'
import ResetPasswordPage from '@/pages/ResetPasswordPage'
import AccountPage from '@/pages/AccountPage'
import WishlistPage from '@/pages/WishlistPage'
import BulkOrderPage from '@/pages/BulkOrderPage'
import NotFoundPage from '@/pages/NotFoundPage'
import ErrorBoundary from '@/components/ErrorBoundary'

// Full Elite Admin Suite Pages
import AdminDashboardPage from '@/admin-suite/pages/DashboardPage'
import AdminAnalyticsPage from '@/admin-suite/pages/AnalyticsPage'
import AdminProductsPage from '@/admin-suite/pages/ProductsPage'
import AdminCategoriesPage from '@/admin-suite/pages/CategoriesPage'
import AdminOrdersPage from '@/admin-suite/pages/OrdersPage'
import AdminCouponsPage from '@/admin-suite/pages/CouponsPage'
import AdminGiftsPage from '@/admin-suite/pages/GiftsPage'
import AdminDelhiveryPage from '@/admin-suite/pages/DelhiveryLogisticsPage'
import AdminBulkOrdersPage from '@/admin-suite/pages/BulkOrdersPage'
import AdminUsersPage from '@/admin-suite/pages/UsersPage'
import AdminHomepageCmsPage from '@/admin-suite/pages/HomepageCmsPage'
import AdminActivityVaultPage from '@/admin-suite/pages/ActivityVaultPage'
import AdminPrintDocumentPage from '@/admin-suite/pages/PrintDocumentPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <PublicLayout />,
    errorElement: <ErrorBoundary />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'shop', element: <ShopPage /> },
      { path: 'product/:slug', element: <ProductDetailPage /> },
      { path: 'cart', element: <Navigate to="/checkout" replace /> },
      { path: 'wishlist', element: <WishlistPage /> },
      { path: 'checkout', element: <CheckoutPage /> },

      { path: 'order-success/:orderId', element: <OrderSuccessPage /> },
      { path: 'track-order', element: <TrackOrderPage /> },
      { path: 'bulk-order', element: <BulkOrderPage /> },
      { path: 'bulk-orders', element: <BulkOrderPage /> },
      { path: 'contact', element: <ContactUsPage /> },
      { path: 'shipping-policy', element: <ShippingPolicyPage /> },
      { path: 'return-policy', element: <ReturnPolicyPage /> },
      { path: 'privacy-policy', element: <PrivacyPolicyPage /> },
      { path: 'about', element: <AboutUsPage /> },
      { path: 'professional-care', element: <ProfessionalCarePage /> },
      { path: 'terms-of-service', element: <TermsOfServicePage /> },
      { path: 'terms-and-conditions', element: <TermsOfServicePage /> },
      { path: 'account', element: <AccountPage /> },
      { path: 'orders', element: <AccountPage /> },
      { path: 'my-orders', element: <AccountPage /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },
      { path: 'forgot-password', element: <ForgotPasswordPage /> },
      { path: 'reset-password', element: <ResetPasswordPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
  {
    path: '/admin',
    element: <AdminRoute />,
    errorElement: <ErrorBoundary />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { index: true, element: <AdminDashboardPage /> },
          { path: 'analytics', element: <AdminAnalyticsPage /> },
          { path: 'products', element: <AdminProductsPage /> },
          { path: 'categories', element: <AdminCategoriesPage /> },
          { path: 'orders', element: <AdminOrdersPage /> },
          { path: 'coupons', element: <AdminCouponsPage /> },
          { path: 'gifts', element: <AdminGiftsPage /> },
          { path: 'delhivery', element: <AdminDelhiveryPage /> },
          { path: 'ekart', element: <AdminDelhiveryPage /> },
          { path: 'bulk-orders', element: <AdminBulkOrdersPage /> },
          { path: 'users', element: <AdminUsersPage /> },
          { path: 'homepage-cms', element: <AdminHomepageCmsPage /> },
          { path: 'activity-vault', element: <AdminActivityVaultPage /> },
          { path: 'print/:type/:id', element: <AdminPrintDocumentPage /> },
          { path: 'print/:type', element: <AdminPrintDocumentPage /> },
          { path: 'print', element: <AdminPrintDocumentPage /> },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <ErrorBoundary />,
  },
])
