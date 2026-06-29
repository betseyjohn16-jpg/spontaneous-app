import { getUncachableStripeClient } from "./stripeClient";

async function createProducts() {
  const stripe = await getUncachableStripeClient();

  const existing = await stripe.products.search({ query: "name:'Spontaneous Pro' AND active:'true'" });

  let productId: string;

  if (existing.data.length > 0) {
    productId = existing.data[0].id;
    console.log("Spontaneous Pro already exists:", productId);
    const prices = await stripe.prices.list({ product: productId, active: true });
    prices.data.forEach((p) => console.log(" Price:", p.id, `$${(p.unit_amount ?? 0) / 100}/${p.recurring?.interval}`));

    const hasMonthly = prices.data.some((p) => p.recurring?.interval === "month");
    const hasAnnual = prices.data.some((p) => p.recurring?.interval === "year");

    if (hasMonthly && hasAnnual) {
      console.log("Both monthly and annual prices already exist.");
      return;
    }
    if (!hasMonthly) {
      const p = await stripe.prices.create({
        product: productId, unit_amount: 299, currency: "usd",
        recurring: { interval: "month" }, nickname: "Pro Monthly",
      });
      console.log("Created monthly price:", p.id, "$2.99/month");
    }
    if (!hasAnnual) {
      const p = await stripe.prices.create({
        product: productId, unit_amount: 1999, currency: "usd",
        recurring: { interval: "year" }, nickname: "Pro Annual",
      });
      console.log("Created annual price:", p.id, "$19.99/year");
    }
    return;
  }

  const product = await stripe.products.create({
    name: "Spontaneous Pro",
    description: "Unlimited restaurant picks and day plans.",
    metadata: { app: "spontaneous" },
  });
  productId = product.id;
  console.log("Created product:", productId);

  const monthly = await stripe.prices.create({
    product: productId, unit_amount: 299, currency: "usd",
    recurring: { interval: "month" }, nickname: "Pro Monthly",
  });
  console.log("Created price:", monthly.id, "$2.99/month");

  const annual = await stripe.prices.create({
    product: productId, unit_amount: 1999, currency: "usd",
    recurring: { interval: "year" }, nickname: "Pro Annual",
  });
  console.log("Created price:", annual.id, "$19.99/year");

  console.log("Done! Webhook will sync to database automatically.");
}

createProducts().catch(console.error);
