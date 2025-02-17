import { createBrowserRouter } from "react-router-dom";
import { AppLayout } from "./pages/_layouts/app-layout";
import { Home } from "./pages/home";
import { User } from "./pages/user";
import { Reports } from "./pages/reports";
import { ReportDetails } from "./pages/report";




export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      {
        path: "/",
        element: <Home />
      },
      {
        path: "/user",
        element: <User />
      },
      {
        path: "/reports",
        element: <Reports />
      },
      {
        path: "/report/:id",
        element: <ReportDetails />
      }
    ]
  },
])
