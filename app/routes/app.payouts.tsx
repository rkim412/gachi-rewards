import type { LoaderFunctionArgs, HeadersFunction } from "react-router";
import { useLoaderData } from "react-router";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";
import prisma from "../db.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const siteId = session.shop;

  const payouts = await prisma.referralJoin.findMany({
    where: { siteId, status: "verified" },
    include: {
      referralCode: {
        include: {
          referrer: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return { payouts };
};

export default function Payouts() {
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
        Payouts
      </h1>

      <s-section heading="Verified Referrals Ready for Payout">
        {data.payouts.length === 0 ? (
          <s-paragraph>No payouts available yet.</s-paragraph>
        ) : (
          <s-stack direction="block" gap="base">
            {data.payouts.map((payout) => (
              <s-box
                key={payout.id}
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
                      {payout.referralCode?.referrer?.email || "Unknown"}
                    </s-text>
                    <s-text size="small" tone="subdued">
                      Order: {payout.orderNumber || payout.orderId}
                    </s-text>
                  </div>
                  <s-text size="large" emphasis="strong">
                    {formatCurrency(payout.orderTotal)}
                  </s-text>
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

