import type { LoaderFunctionArgs, HeadersFunction } from "react-router";
import { useLoaderData } from "react-router";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";
import prisma from "../db.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const siteId = session.shop;

  // Get program-wide statistics
  const [
    totalAffiliates,
    totalReferrals,
    totalRevenue,
    pendingReferrals,
    verifiedReferrals,
    programConfig,
  ] = await Promise.all([
    // Total affiliates (customers with referral codes)
    prisma.storefrontUser.count({
      where: { siteId },
    }),
    // Total referrals (successful conversions)
    prisma.referralJoin.count({
      where: { siteId },
    }),
    // Total revenue from referrals
    prisma.referralJoin.aggregate({
      where: { siteId },
      _sum: { orderTotal: true },
    }),
    // Pending referrals
    prisma.referralJoin.count({
      where: { siteId, status: "pending" },
    }),
    // Verified referrals
    prisma.referralJoin.count({
      where: { siteId, status: "verified" },
    }),
    // Program configuration
    prisma.referralConfig.findUnique({
      where: { siteId },
    }),
  ]);

  return {
    siteId,
    programStats: {
      totalAffiliates,
      totalReferrals,
      totalRevenue: totalRevenue._sum.orderTotal || 0,
      pendingReferrals,
      verifiedReferrals,
      programEnabled: programConfig?.enabled ?? true,
      discountAmount: programConfig?.amount || 10.0,
      discountType: programConfig?.type || "percentage",
    },
  };
};

export default function Dashboard() {
  const data = useLoaderData<typeof loader>();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  return (
    <div>
      <h1 style={{ fontSize: "2rem", fontWeight: "bold", marginBottom: "2rem", color: "#1a1d29" }}>
        Dashboard
      </h1>

      {/* Top Metrics Cards */}
      <s-stack direction="inline" gap="base" style={{ marginBottom: "2rem" }}>
        <s-box
          padding="base"
          borderWidth="base"
          borderRadius="base"
          background="base"
          style={{
            flex: 1,
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            backgroundColor: "white",
          }}
        >
          <s-text size="large" emphasis="strong" style={{ fontSize: "2rem", color: "#1a1d29" }}>
            {data.programStats.totalAffiliates}
          </s-text>
          <s-text size="small" tone="subdued" style={{ color: "#6b7280" }}>
            Active affiliates
          </s-text>
        </s-box>

        <s-box
          padding="base"
          borderWidth="base"
          borderRadius="base"
          background="base"
          style={{
            flex: 1,
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            backgroundColor: "white",
          }}
        >
          <s-text size="large" emphasis="strong" style={{ fontSize: "2rem", color: "#1a1d29" }}>
            {formatCurrency(data.programStats.totalRevenue)}
          </s-text>
          <s-text size="small" tone="subdued" style={{ color: "#6b7280" }}>
            Total revenue from referrals
          </s-text>
        </s-box>

        <s-box
          padding="base"
          borderWidth="base"
          borderRadius="base"
          background="base"
          style={{
            flex: 1,
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            backgroundColor: "white",
          }}
        >
          <s-text size="large" emphasis="strong" style={{ fontSize: "2rem", color: "#1a1d29" }}>
            {data.programStats.verifiedReferrals}
          </s-text>
          <s-text size="small" tone="subdued" style={{ color: "#6b7280" }}>
            Verified referrals
          </s-text>
        </s-box>

        <s-box
          padding="base"
          borderWidth="base"
          borderRadius="base"
          background="base"
          style={{
            flex: 1,
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            backgroundColor: "white",
          }}
        >
          <s-text size="large" emphasis="strong" style={{ fontSize: "2rem", color: "#1a1d29" }}>
            {data.programStats.totalReferrals}
          </s-text>
          <s-text size="small" tone="subdued" style={{ color: "#6b7280" }}>
            Total referrals
          </s-text>
        </s-box>
      </s-stack>

      {/* Additional Dashboard Content */}
      <s-section heading="Program Status">
        <s-stack direction="block" gap="base">
          <s-text>
            Status:{" "}
            <s-text emphasis="strong">
              {data.programStats.programEnabled ? "Enabled" : "Disabled"}
            </s-text>
          </s-text>
          <s-text>
            Discount:{" "}
            <s-text emphasis="strong">
              {data.programStats.discountType === "percentage"
                ? `${data.programStats.discountAmount}%`
                : formatCurrency(data.programStats.discountAmount)}
            </s-text>
          </s-text>
        </s-stack>
      </s-section>
    </div>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};

