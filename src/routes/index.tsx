import { createBrowserRouter } from "react-router-dom";
import { App } from "@/App";
import { Home } from "@/pages/Home";
import { AccountLayout } from "@/pages/account/AccountLayout";
import { AccountHome } from "@/pages/account/AccountHome";
import { AccountProfile } from "@/pages/account/AccountProfile";
import { AccountOrders } from "@/pages/account/AccountOrders";
import { AccountAddresses } from "@/pages/account/AccountAddresses";
import { AccountAuth } from "@/pages/account/AccountAuth";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        path: "/",
        element: <Home />,
      },
      {
        path: "/minhaconta/login",
        element: <AccountAuth />,
      },
      {
        path: "/minhaconta",
        element: <AccountLayout />,
        children: [
          {
            path: "",
            element: <AccountHome />,
          },
          {
            path: "dados",
            element: <AccountProfile />,
          },
          {
            path: "pedidos",
            element: <AccountOrders />,
          },
          {
            path: "enderecos",
            element: <AccountAddresses />,
          },
        ],
      },
    ],
  },
]); 