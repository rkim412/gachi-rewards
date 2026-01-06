import type { LoaderFunctionArgs, HeadersFunction } from "react-router";
import { useLoaderData } from "react-router";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";
import prisma from "../db.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const siteId = session.shop;

  const config = await prisma.referralConfig.findUnique({
    where: { siteId },
  });

  return { config, siteId };
};

export default function Settings() {
  const data = useLoaderData<typeof loader>();

  return (
    <div>
      <h1 style={{ fontSize: "2rem", fontWeight: "bold", marginBottom: "2rem", color: "#1a1d29" }}>
        Settings
      </h1>

      <s-section heading="Program Configuration">
        <s-stack direction="block" gap="base">
          <s-text>
            <s-text emphasis="strong">Shop:</s-text> {data.siteId}
          </s-text>
          <s-text>
            <s-text emphasis="strong">Program Enabled:</s-text>{" "}
            {data.config?.enabled ? "Yes" : "No"}
          </s-text>
          <s-text>
            <s-text emphasis="strong">Discount Type:</s-text> {data.config?.type || "percentage"}
          </s-text>
          <s-text>
            <s-text emphasis="strong">Discount Amount:</s-text> {data.config?.amount || 10}%
          </s-text>
          <s-text>
            <s-text emphasis="strong">Safe Link Expiry:</s-text>{" "}
            {data.config?.safeLinkExpiryHours || 168} hours
          </s-text>
        </s-stack>
      </s-section>
    </div>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};

