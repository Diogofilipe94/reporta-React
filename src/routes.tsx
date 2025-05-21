import { createBrowserRouter } from "react-router-dom";
import { AppLayout } from "./pages/_layouts/app-layout";
import { Home } from "./pages/home";
import { Reports } from "./pages/reports";
import { ReportDetails } from "./pages/report";
import { AdminUsers } from "./pages/admin/users";

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      {
        path: "/",
        element: <Home />
      },
      {
        path: "/reports",
        element: <Reports />
      },
      {
        path: "/report/:id",
        element: <ReportDetails />
      },
      {
        path: "/admin/users",
        element: <AdminUsers />
      }
    ]
  },
])
