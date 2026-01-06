import type { LoaderFunctionArgs, HeadersFunction } from "react-router";
import { useLoaderData } from "react-router";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";
import prisma from "../db.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const siteId = session.shop;

  const affiliates = await prisma.storefrontUser.findMany({
    where: { siteId },
    include: {
      referralDiscountCode: true,
      referralsMade: {
        select: {
          id: true,
          orderTotal: true,
          discountAmount: true,
          status: true,
          createdAt: true,
          refereeEmail: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const affiliatesWithStats = affiliates.map((affiliate) => {
    const referrals = affiliate.referralsMade || [];
    const totalReferrals = referrals.length;
    const verifiedReferrals = referrals.filter((r) => r.status === "verified").length;
    const totalRevenue = referrals.reduce((sum, r) => sum + (r.orderTotal || 0), 0);

    return {
      id: affiliate.id,
      email: affiliate.email,
      referralCode: affiliate.referralDiscountCode?.referralCode || "N/A",
      discountCode: affiliate.referralDiscountCode?.discountCode || "N/A",
      createdAt: affiliate.createdAt,
      stats: {
        totalReferrals,
        verifiedReferrals,
        totalRevenue,
      },
    };
  });

  return { affiliates: affiliatesWithStats };
};

export default function Affiliates() {
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
    });
  };

  return (
    <div>
      <h1 style={{ fontSize: "2rem", fontWeight: "bold", marginBottom: "2rem", color: "#1a1d29" }}>
        Affiliates
      </h1>

      {data.affiliates.length === 0 ? (
        <s-paragraph>No affiliates yet.</s-paragraph>
      ) : (
        <s-stack direction="block" gap="base">
          {data.affiliates.map((affiliate) => (
            <s-box
              key={affiliate.id}
              padding="base"
              borderWidth="base"
              borderRadius="base"
              background="base"
              style={{
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                backgroundColor: "white",
              }}
            >
              <s-stack direction="block" gap="small">
                <s-stack direction="inline" gap="base" alignment="space-between">
                  <div>
                    <s-heading size="small">{affiliate.email}</s-heading>
                    <s-text size="small" tone="subdued">
                      Joined: {formatDate(affiliate.createdAt)}
                    </s-text>
                  </div>
                  <s-badge tone="info">{affiliate.referralCode}</s-badge>
                </s-stack>

                <s-stack direction="inline" gap="base" style={{ marginTop: "1rem" }}>
                  <s-box padding="small" background="base" borderRadius="small">
                    <s-text size="small" tone="subdued">Referrals</s-text>
                    <s-text size="medium" emphasis="strong">
                      {affiliate.stats.totalReferrals}
                    </s-text>
                  </s-box>
                  <s-box padding="small" background="base" borderRadius="small">
                    <s-text size="small" tone="subdued">Verified</s-text>
                    <s-text size="medium" emphasis="strong">
                      {affiliate.stats.verifiedReferrals}
                    </s-text>
                  </s-box>
                  <s-box padding="small" background="base" borderRadius="small">
                    <s-text size="small" tone="subdued">Revenue</s-text>
                    <s-text size="medium" emphasis="strong">
                      {formatCurrency(affiliate.stats.totalRevenue)}
                    </s-text>
                  </s-box>
                </s-stack>
              </s-stack>
            </s-box>
          ))}
        </s-stack>
      )}
    </div>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};

