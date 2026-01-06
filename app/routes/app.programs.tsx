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

export default function Programs() {
  const data = useLoaderData<typeof loader>();

  return (
    <div>
      <h1 style={{ fontSize: "2rem", fontWeight: "bold", marginBottom: "2rem", color: "#1a1d29" }}>
        Programs
      </h1>

      <s-section heading="Referral Program Configuration">
        <s-stack direction="block" gap="base">
          <s-text>
            Program Status:{" "}
            <s-text emphasis="strong">
              {data.config?.enabled ? "Enabled" : "Disabled"}
            </s-text>
          </s-text>
          <s-text>
            Discount Type:{" "}
            <s-text emphasis="strong">
              {data.config?.type || "percentage"}
            </s-text>
          </s-text>
          <s-text>
            Discount Amount:{" "}
            <s-text emphasis="strong">
              {data.config?.amount || 10}%
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

