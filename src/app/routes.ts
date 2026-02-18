import { createBrowserRouter } from "react-router";
import { Layout } from "./components/layout";
import { Dashboard } from "./components/dashboard";
import { Inventory } from "./components/inventory";
import { AccountService } from "./components/account-service";
import { Deployment } from "./components/deployment";
import { Compliance } from "./components/compliance";
import { Analytics } from "./components/analytics";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: Dashboard },
      { path: "inventory", Component: Inventory },
      { path: "account-service", Component: AccountService },
      { path: "deployment", Component: Deployment },
      { path: "compliance", Component: Compliance },
      { path: "analytics", Component: Analytics },
    ],
  },
]);
