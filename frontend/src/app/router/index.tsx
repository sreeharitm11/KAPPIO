import { createBrowserRouter } from "react-router";
import LandingPage from "../../features/home/pages/LandingPage";
import CustomerLayout from "../../features/customer/layouts/CustomerLayout";
import CustomerMenuPage from "../../features/customer/pages/CustomerMenuPage";
import CartPage from "../../features/customer/pages/CartPage";
import CheckoutPage from "../../features/customer/pages/CheckoutPage";
import OrderConfirmationPage from "../../features/customer/pages/OrderConfirmationPage";
import CustomerProfilePage from "../../features/customer/pages/CustomerProfilePage";
import DeliveryLayout from "../../features/delivery/layouts/DeliveryLayout";
import DeliveryOrdersPage from "../../features/delivery/pages/DeliveryOrdersPage";
import OrderDetailsPage from "../../features/delivery/pages/OrderDetailsPage";
import AdminLayout from "../../features/admin/layouts/AdminLayout";
import AdminDashboardPage from "../../features/admin/pages/AdminDashboardPage";
import OrdersManagementPage from "../../features/admin/pages/OrdersManagementPage";
import MenuManagementPage from "../../features/admin/pages/MenuManagementPage";
import InventoryPage from "../../features/admin/pages/InventoryPage";
import FinancePage from "../../features/admin/pages/FinancePage";
import ReportsPage from "../../features/admin/pages/ReportsPage";
import TeamStaffPage from "../../features/admin/pages/TeamStaffPage";
import CustomerLoginPage from "../../features/auth/pages/CustomerLoginPage";
import CustomerSignupPage from "../../features/auth/pages/CustomerSignupPage";
import AdminLoginPage from "../../features/auth/pages/AdminLoginPage";
import DeliveryLoginPage from "../../features/auth/pages/DeliveryLoginPage";
import InviteSetupPasswordPage from "../../features/auth/pages/InviteSetupPasswordPage";
import { RequireRole } from "../../features/auth/components/RequireRole";
import { ErrorBoundary } from "../../shared/components/ErrorBoundary";
import { NotFound } from "../../shared/components/NotFound";
import { Navigate } from "react-router";

export const router = createBrowserRouter([
  {
    path: "/",
    errorElement: <ErrorBoundary />,
    children: [
      { index: true, Component: LandingPage },
      {
        Component: CustomerLayout,
        children: [
          { path: "menu", Component: CustomerMenuPage },
          { path: "cart", Component: CartPage },
          { path: "checkout", Component: CheckoutPage },
          { path: "confirmation/:orderId", Component: OrderConfirmationPage },
          { path: "profile", Component: CustomerProfilePage },
        ],
      },
    ],
  },
  { path: "/login", Component: CustomerLoginPage },
  { path: "/signup", Component: CustomerSignupPage },
  { path: "/admin/login", Component: AdminLoginPage },
  { path: "/deliverypartner/login", Component: DeliveryLoginPage },
  { path: "/invite/setup-password", Component: InviteSetupPasswordPage },
  {
    path: "/admin",
    Component: () => (
      <RequireRole roles={["ADMIN", "STAFF"]} redirectTo="/admin/login">
        <AdminLayout />
      </RequireRole>
    ),
    errorElement: <ErrorBoundary />,
    children: [
      { index: true, Component: AdminDashboardPage },
      { path: "orders", Component: OrdersManagementPage },
      { path: "menu", Component: MenuManagementPage },
      { path: "inventory", Component: InventoryPage },
      { path: "team", Component: TeamStaffPage },
      { path: "finance", Component: FinancePage },
      { path: "reports", Component: ReportsPage },
    ],
  },
  {
    path: "/delivery",
    Component: () => <Navigate to="/deliverypartner" replace />
  },
  {
    path: "/deliverypartner",
    Component: () => (
      <RequireRole roles={["DELIVERY"]} redirectTo="/deliverypartner/login">
        <DeliveryLayout />
      </RequireRole>
    ),
    errorElement: <ErrorBoundary />,
    children: [
      { index: true, Component: DeliveryOrdersPage },
      { path: "order/:orderId", Component: OrderDetailsPage },
    ],
  },
  { path: "*", Component: NotFound }
]);
