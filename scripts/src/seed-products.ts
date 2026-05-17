import { getUncachableStripeClient } from "./stripeClient";

async function createProducts() {
  const stripe = await getUncachableStripeClient();

  const existing = await stripe.products.search({ query: "name:'Spontaneous Pro' AND active:'true'" });
  if (existing.data.length > 0) {
    console.log("Spontaneous Pro already exists:", existing.data[0].id);
    const prices = await stripe.prices.list({ product: existing.data[0].id, active: true });
    prices.data.forEach((p) => console.log(" Price:", p.id, `$${(p.unit_amount ?? 0) / 100}/${p.recurring?.interval}`));
    return;
  }

  const product = await stripe.products.create({
    name: "Spontaneous Pro",
    description: "Unlimited restaurant picks and day plans. $2.99/month.",
  });
  console.log("Created product:", product.id);

  const price = await stripe.prices.create({
    product: product.id,
    unit_amount: 299,
    currency: "usd",
    recurring: { interval: "month" },
  });
  console.log("Created price:", price.id, "$2.99/month");
  console.log("Done! Webhook will sync to database automatically.");
}

createProducts().catch(console.error);
