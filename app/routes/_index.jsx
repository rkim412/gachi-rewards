import { redirect, Form, useLoaderData } from "react-router";
import { login } from "../shopify.server";
import styles from "./_index/styles.module.css";

export const loader = async ({ request }) => {
  const url = new URL(request.url);

  if (url.searchParams.get("shop")) {
    throw redirect(`/app?${url.searchParams.toString()}`);
  }

  return { showForm: Boolean(login) };
};

export default function Index() {
  const { showForm } = useLoaderData();

  return (
    <div className={styles.index}>
      <div className={styles.content}>
        <h1 className={styles.heading}>Gachi Rewards - Viral Referral Engine</h1>
        <p className={styles.text}>
          Turn every customer into a brand ambassador. Automatic referral links, secure discount codes, and viral growth for your Shopify store.
        </p>
        {showForm && (
          <Form className={styles.form} method="post" action="/auth/login">
            <label className={styles.label}>
              <span>Shop domain</span>
              <input className={styles.input} type="text" name="shop" />
              <span>e.g: my-shop-domain.myshopify.com</span>
            </label>
            <button className={styles.button} type="submit">
              Log in
            </button>
          </Form>
        )}
        <ul className={styles.list}>
          <li>
            <strong>Automatic Referral Links</strong>. Every customer gets a unique referral code after purchase, ready to share with friends and family.
          </li>
          <li>
            <strong>Secure One-Time Discounts</strong>. Safe links prevent coupon code scraping and ensure discounts are used once per customer.
          </li>
          <li>
            <strong>Viral Growth Engine</strong>. Track referrals, reward customers, and watch your customer base grow organically through word-of-mouth.
          </li>
        </ul>
      </div>
    </div>
  );
}

