import { Link, Outlet, useLoaderData, useRouteError, useLocation } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { AppProvider } from "@shopify/shopify-app-react-router/react";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  await authenticate.admin(request);

  // eslint-disable-next-line no-undef
  return { apiKey: process.env.SHOPIFY_API_KEY || "" };
};

export default function App() {
  const { apiKey } = useLoaderData();
  const location = useLocation();

  const navItems = [
    { path: "/app", label: "Dashboard", icon: "🏠" },
    { path: "/app/programs", label: "Programs", icon: "📋" },
    { path: "/app/affiliates", label: "Affiliates", icon: "👥" },
    { path: "/app/analytics", label: "Analytics", icon: "📊" },
    { path: "/app/payouts", label: "Payouts", icon: "💳" },
    { path: "/app/settings", label: "Settings", icon: "⚙️" },
  ];

  const isActive = (path) => {
    if (path === "/app") {
      return location.pathname === "/app" || location.pathname === "/app/";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <AppProvider embedded apiKey={apiKey}>
      <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
        {/* Left Sidebar */}
        <aside
          style={{
            width: "250px",
            backgroundColor: "#1a1d29",
            color: "white",
            display: "flex",
            flexDirection: "column",
            padding: "1.5rem",
            boxShadow: "2px 0 4px rgba(0,0,0,0.1)",
          }}
        >
          {/* Logo */}
          <div style={{ marginBottom: "2rem" }}>
            <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: "bold", color: "white" }}>
              Gachi Rewards
            </h1>
          </div>

          {/* Navigation Menu */}
          <nav style={{ flex: 1 }}>
            <s-stack direction="block" gap="small">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    padding: "0.75rem 1rem",
                    borderRadius: "8px",
                    textDecoration: "none",
                    color: "white",
                    backgroundColor: isActive(item.path) ? "rgba(147, 51, 234, 0.2)" : "transparent",
                    borderLeft: isActive(item.path) ? "3px solid #9333ea" : "3px solid transparent",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive(item.path)) {
                      e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive(item.path)) {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }
                  }}
                >
                  <span style={{ fontSize: "1.25rem" }}>{item.icon}</span>
                  <span style={{ fontSize: "0.95rem", fontWeight: isActive(item.path) ? "600" : "400" }}>
                    {item.label}
                  </span>
                </Link>
              ))}
            </s-stack>
          </nav>

          {/* User Profile Section (Bottom) */}
          <div
            style={{
              marginTop: "auto",
              paddingTop: "1.5rem",
              borderTop: "1px solid rgba(255, 255, 255, 0.1)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                marginBottom: "1rem",
                padding: "0.75rem",
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                borderRadius: "8px",
              }}
            >
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  backgroundColor: "#fbbf24",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  fontWeight: "bold",
                }}
              >
                A
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "0.875rem", fontWeight: "600" }}>Hello Admin</div>
                <div style={{ fontSize: "0.75rem", color: "rgba(255, 255, 255, 0.7)" }}>
                  ADMIN
                </div>
              </div>
            </div>
            <s-button
              variant="primary"
              onClick={() => {
                // Handle make affiliate link action
                console.log("Make affiliate link clicked");
              }}
              style={{
                width: "100%",
                backgroundColor: "#9333ea",
                border: "none",
                borderRadius: "8px",
                padding: "0.75rem",
                color: "white",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              Make affiliate link
            </s-button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main
          style={{
            flex: 1,
            backgroundColor: "#f5f5f5",
            overflow: "auto",
            padding: "2rem",
          }}
        >
          <Outlet />
        </main>
      </div>
    </AppProvider>
  );
}

// Shopify needs React Router to catch some thrown responses, so that their headers are included in the response.
export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
