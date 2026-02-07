import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import Scanner from "./pages/scanner";
import Table from "./pages/table";
const router = createBrowserRouter([
  {
    path: "/",
    element: <Scanner />,
  },
  {
    path: "/table",
    element: <Table />,
  },

]
,{
  basename: '/scanner/'
}
);
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);
