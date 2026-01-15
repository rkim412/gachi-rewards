import type { LoaderFunctionArgs, HeadersFunction } from "react-router";
import { useLoaderData } from "react-router";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";
import prisma from "../db.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const siteId = session.shop;

  // Get analytics data
  const [
    totalReferrals,
    referralsByStatus,
    topAffiliates,
    recentReferrals,
    revenueByMonth,
  ] = await Promise.all([
    // Total referrals count
    prisma.referralJoin.count({
      where: { siteId },
    }),
    // Referrals grouped by status
    prisma.referralJoin.groupBy({
      by: ["status"],
      where: { siteId },
      _count: {
        id: true,
      },
    }),
    // Top 10 affiliates by referral count
    prisma.storefrontUser.findMany({
      where: { siteId },
      include: {
        referralCode: true,
        referralsMade: {
          select: {
            orderTotal: true,
            status: true,
          },
        },
      },
      take: 10,
    }),
    // Recent referrals (last 10)
    prisma.referralJoin.findMany({
      where: { siteId },
      include: {
        referralCode: {
          include: {
            referrer: true,
          },
        },
      },
      take: 10,
      orderBy: {
        createdAt: "desc",
      },
    }),
    // Revenue aggregation (this is a simplified version)
    prisma.referralJoin.aggregate({
      where: { siteId },
      _sum: {
        orderTotal: true,
        discountAmount: true,
      },
      _avg: {
        orderTotal: true,
      },
    }),
  ]);

  // Process top affiliates data and sort by referral count
  const topAffiliatesWithStats = topAffiliates
    .map((affiliate) => {
      const referrals = affiliate.referralsMade || [];
      const totalReferrals = referrals.length;
      const totalRevenue = referrals.reduce((sum, r) => sum + (r.orderTotal || 0), 0);

      return {
        email: affiliate.email,
        referralCode: affiliate.referralCode?.code || "N/A",
        totalReferrals,
        totalRevenue,
      };
    })
    .sort((a, b) => b.totalReferrals - a.totalReferrals)
    .slice(0, 10);

  // Process referrals by status
  const statusBreakdown = referralsByStatus.reduce((acc, item) => {
    acc[item.status] = item._count.id;
    return acc;
  }, {} as Record<string, number>);

  return {
    totalReferrals,
    statusBreakdown,
    topAffiliates: topAffiliatesWithStats,
    recentReferrals,
    revenueStats: {
      totalRevenue: revenueByMonth._sum.orderTotal || 0,
      totalDiscounts: revenueByMonth._sum.discountAmount || 0,
      averageOrderValue: revenueByMonth._avg.orderTotal || 0,
    },
  };
};

export default function Analytics() {
  const data = useLoaderData<typeof loader>();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div>
      <h1 style={{ fontSize: "2rem", fontWeight: "bold", marginBottom: "2rem", color: "#1a1d29" }}>
        Analytics
      </h1>

      {/* Revenue Overview */}
      <s-section heading="Revenue Overview" style={{ marginBottom: "2rem" }}>
        <s-stack direction="inline" gap="base">
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
            <s-text size="small" tone="subdued" style={{ color: "#6b7280" }}>
              Total Revenue
            </s-text>
            <s-text size="large" emphasis="strong" style={{ fontSize: "2rem", color: "#1a1d29" }}>
              {formatCurrency(data.revenueStats.totalRevenue)}
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
            <s-text size="small" tone="subdued" style={{ color: "#6b7280" }}>
              Total Discounts Given
            </s-text>
            <s-text size="large" emphasis="strong" style={{ fontSize: "2rem", color: "#1a1d29" }}>
              {formatCurrency(data.revenueStats.totalDiscounts)}
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
            <s-text size="small" tone="subdued" style={{ color: "#6b7280" }}>
              Average Order Value
            </s-text>
            <s-text size="large" emphasis="strong" style={{ fontSize: "2rem", color: "#1a1d29" }}>
              {formatCurrency(data.revenueStats.averageOrderValue)}
            </s-text>
          </s-box>
        </s-stack>
      </s-section>

      {/* Status Breakdown */}
      <s-section heading="Referral Status Breakdown" style={{ marginBottom: "2rem" }}>
        <s-stack direction="block" gap="base">
          {Object.entries(data.statusBreakdown).map(([status, count]) => (
            <s-box
              key={status}
              padding="base"
              borderWidth="base"
              borderRadius="base"
              background="base"
              style={{
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                backgroundColor: "white",
              }}
            >
              <s-stack direction="inline" gap="base" alignment="space-between">
                <s-text emphasis="strong" style={{ textTransform: "capitalize" }}>
                  {status}
                </s-text>
                <s-text size="large" emphasis="strong">
                  {count}
                </s-text>
              </s-stack>
            </s-box>
          ))}
        </s-stack>
      </s-section>

      {/* Top Affiliates */}
      <s-section heading="Top Affiliates" style={{ marginBottom: "2rem" }}>
        {data.topAffiliates.length === 0 ? (
          <s-paragraph>No affiliate data available yet.</s-paragraph>
        ) : (
          <s-stack direction="block" gap="base">
            {data.topAffiliates.map((affiliate, index) => (
              <s-box
                key={index}
                padding="base"
                borderWidth="base"
                borderRadius="base"
                background="base"
                style={{
                  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                  backgroundColor: "white",
                }}
              >
                <s-stack direction="inline" gap="base" alignment="space-between">
                  <div>
                    <s-text emphasis="strong">{affiliate.email}</s-text>
                    <s-text size="small" tone="subdued">
                      Code: {affiliate.referralCode}
                    </s-text>
                  </div>
                  <s-stack direction="inline" gap="base">
                    <s-text>
                      <s-text tone="subdued">Referrals: </s-text>
                      <s-text emphasis="strong">{affiliate.totalReferrals}</s-text>
                    </s-text>
                    <s-text>
                      <s-text tone="subdued">Revenue: </s-text>
                      <s-text emphasis="strong">{formatCurrency(affiliate.totalRevenue)}</s-text>
                    </s-text>
                  </s-stack>
                </s-stack>
              </s-box>
            ))}
          </s-stack>
        )}
      </s-section>

      {/* Recent Referrals */}
      <s-section heading="Recent Referrals">
        {data.recentReferrals.length === 0 ? (
          <s-paragraph>No recent referrals.</s-paragraph>
        ) : (
          <s-stack direction="block" gap="base">
            {data.recentReferrals.map((referral) => (
              <s-box
                key={referral.id}
                padding="base"
                borderWidth="base"
                borderRadius="base"
                background="base"
                style={{
                  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                  backgroundColor: "white",
                }}
              >
                <s-stack direction="inline" gap="base" alignment="space-between">
                  <div>
                    <s-text emphasis="strong">
                      {referral.referralCode?.referrer?.email || "Unknown"}
                    </s-text>
                    <s-text size="small" tone="subdued">
                      {referral.refereeEmail} • {formatDate(referral.createdAt)}
                    </s-text>
                  </div>
                  <s-stack direction="inline" gap="base">
                    <s-badge tone={referral.status === "verified" ? "success" : "info"}>
                      {referral.status}
                    </s-badge>
                    <s-text emphasis="strong">
                      {formatCurrency(referral.orderTotal)}
                    </s-text>
                  </s-stack>
                </s-stack>
              </s-box>
            ))}
          </s-stack>
        )}
      </s-section>
    </div>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
