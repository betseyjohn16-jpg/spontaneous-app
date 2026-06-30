import { Router } from "express";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import { db } from "@workspace/db";
import {
  restaurantsTable,
  availabilitySlotsTable,
  blackoutsTable,
  menuItemsTable,
  restaurantReservationsTable,
  reservationOrderItemsTable,
} from "@workspace/db";
import {
  RegisterRestaurantBody,
  UpdateMyRestaurantBody,
  CreateAvailabilitySlotBody,
  DeleteAvailabilitySlotParams,
  CreateBlackoutBody,
  DeleteBlackoutParams,
  CreateMenuItemBody,
  UpdateMenuItemParams,
  UpdateMenuItemBody,
  DeleteMenuItemParams,
  ListRestaurantReservationsQueryParams,
  AcceptReservationParams,
  DeclineReservationParams,
  GetPublicAvailabilityParams,
  GetPublicMenuParams,
} from "@workspace/api-zod";
import { clerkMiddleware, getAuth } from "@clerk/express";
import { randomUUID } from "crypto";

const router = Router();

function generateId(): string {
  return randomUUID();
}

function chars32() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

async function getRestaurantForOwner(ownerId: string) {
  const [restaurant] = await db
    .select()
    .from(restaurantsTable)
    .where(eq(restaurantsTable.ownerId, ownerId))
    .limit(1);
  return restaurant ?? null;
}

async function getReservationWithOrder(id: number) {
  const [reservation] = await db
    .select()
    .from(restaurantReservationsTable)
    .where(eq(restaurantReservationsTable.id, id))
    .limit(1);
  if (!reservation) return null;

  const orderItems = await db
    .select()
    .from(reservationOrderItemsTable)
    .where(eq(reservationOrderItemsTable.reservationId, id));

  const totalOrderAmount = orderItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return {
    ...reservation,
    orderItems,
    totalOrderAmount,
  };
}

async function getReservationsWithOrders(restaurantId: string, status?: string) {
  const conditions = [eq(restaurantReservationsTable.restaurantId, restaurantId)];
  if (status && status !== "all") {
    conditions.push(eq(restaurantReservationsTable.status, status));
  }

  const reservations = await db
    .select()
    .from(restaurantReservationsTable)
    .where(and(...conditions))
    .orderBy(restaurantReservationsTable.createdAt);

  const result = await Promise.all(
    reservations.map(async (r) => {
      const orderItems = await db
        .select()
        .from(reservationOrderItemsTable)
        .where(eq(reservationOrderItemsTable.reservationId, r.id));
      return {
        ...r,
        orderItems,
        totalOrderAmount: orderItems.reduce((s, i) => s + i.price * i.quantity, 0),
      };
    })
  );

  return result;
}

// ─── GET /restaurant/me ────────────────────────────────────────────────────────
router.get("/restaurant/me", async (req, res) => {
  const auth = getAuth(req);
  const ownerId = auth?.userId ?? "demo-owner";

  const restaurant = await getRestaurantForOwner(ownerId);
  if (!restaurant) {
    return res.status(404).json({ error: "No restaurant found for this account" });
  }
  return res.json(restaurant);
});

// ─── PATCH /restaurant/me ─────────────────────────────────────────────────────
router.patch("/restaurant/me", async (req, res) => {
  const auth = getAuth(req);
  const ownerId = auth?.userId ?? "demo-owner";
  const body = UpdateMyRestaurantBody.parse(req.body);

  const restaurant = await getRestaurantForOwner(ownerId);
  if (!restaurant) {
    return res.status(404).json({ error: "No restaurant found for this account" });
  }

  const update: Record<string, unknown> = {};
  if (body.name !== undefined) update.name = body.name;
  if (body.cuisine !== undefined) update.cuisine = body.cuisine;
  if (body.description !== undefined) update.description = body.description;
  if (body.address !== undefined) update.address = body.address;
  if (body.phone !== undefined) update.phone = body.phone;
  if (body.email !== undefined) update.email = body.email;
  if (body.openingHours !== undefined) update.openingHours = body.openingHours;
  if (body.priceRange !== undefined) update.priceRange = body.priceRange;
  if (body.isActive !== undefined) update.isActive = body.isActive;

  const [updated] = await db
    .update(restaurantsTable)
    .set(update)
    .where(eq(restaurantsTable.id, restaurant.id))
    .returning();

  return res.json(updated);
});

// ─── POST /restaurant/register ────────────────────────────────────────────────
router.post("/restaurant/register", async (req, res) => {
  const auth = getAuth(req);
  const ownerId = auth?.userId ?? "demo-owner";
  const body = RegisterRestaurantBody.parse(req.body);

  const existing = await getRestaurantForOwner(ownerId);
  if (existing) {
    return res.status(409).json({ error: "Restaurant already registered for this account" });
  }

  const [restaurant] = await db
    .insert(restaurantsTable)
    .values({
      id: generateId(),
      ownerId,
      name: body.name,
      cuisine: body.cuisine,
      description: body.description,
      address: body.address,
      phone: body.phone,
      email: body.email,
      openingHours: body.openingHours,
      priceRange: body.priceRange,
    })
    .returning();

  return res.status(201).json(restaurant);
});

// ─── GET /restaurant/dashboard ────────────────────────────────────────────────
router.get("/restaurant/dashboard", async (req, res) => {
  const auth = getAuth(req);
  const ownerId = auth?.userId ?? "demo-owner";

  const restaurant = await getRestaurantForOwner(ownerId);
  if (!restaurant) {
    return res.json({
      todayReservations: 0,
      pendingReservations: 0,
      totalReservations: 0,
      totalMenuItems: 0,
      upcomingReservations: [],
    });
  }

  const today = new Date().toISOString().split("T")[0]!;

  const [todayRows, pendingRows, totalRows, menuRows] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)` })
      .from(restaurantReservationsTable)
      .where(
        and(
          eq(restaurantReservationsTable.restaurantId, restaurant.id),
          eq(restaurantReservationsTable.date, today)
        )
      ),
    db
      .select({ count: sql<number>`count(*)` })
      .from(restaurantReservationsTable)
      .where(
        and(
          eq(restaurantReservationsTable.restaurantId, restaurant.id),
          eq(restaurantReservationsTable.status, "pending")
        )
      ),
    db
      .select({ count: sql<number>`count(*)` })
      .from(restaurantReservationsTable)
      .where(eq(restaurantReservationsTable.restaurantId, restaurant.id)),
    db
      .select({ count: sql<number>`count(*)` })
      .from(menuItemsTable)
      .where(eq(menuItemsTable.restaurantId, restaurant.id)),
  ]);

  const upcomingReservations = await getReservationsWithOrders(restaurant.id, "pending");

  return res.json({
    todayReservations: Number(todayRows[0]?.count ?? 0),
    pendingReservations: Number(pendingRows[0]?.count ?? 0),
    totalReservations: Number(totalRows[0]?.count ?? 0),
    totalMenuItems: Number(menuRows[0]?.count ?? 0),
    upcomingReservations: upcomingReservations.slice(0, 10),
  });
});

// ─── GET /restaurant/availability ────────────────────────────────────────────
router.get("/restaurant/availability", async (req, res) => {
  const auth = getAuth(req);
  const ownerId = auth?.userId ?? "demo-owner";

  const restaurant = await getRestaurantForOwner(ownerId);
  if (!restaurant) return res.json([]);

  const slots = await db
    .select()
    .from(availabilitySlotsTable)
    .where(eq(availabilitySlotsTable.restaurantId, restaurant.id))
    .orderBy(availabilitySlotsTable.date, availabilitySlotsTable.time);

  return res.json(slots);
});

// ─── POST /restaurant/availability ───────────────────────────────────────────
router.post("/restaurant/availability", async (req, res) => {
  const auth = getAuth(req);
  const ownerId = auth?.userId ?? "demo-owner";
  const body = CreateAvailabilitySlotBody.parse(req.body);

  const restaurant = await getRestaurantForOwner(ownerId);
  if (!restaurant) {
    return res.status(404).json({ error: "No restaurant found for this account" });
  }

  const [slot] = await db
    .insert(availabilitySlotsTable)
    .values({
      restaurantId: restaurant.id,
      date: body.date,
      time: body.time,
      partyMin: body.partyMin,
      partyMax: body.partyMax,
      capacity: body.capacity,
    })
    .returning();

  return res.status(201).json(slot);
});

// ─── DELETE /restaurant/availability/:id ─────────────────────────────────────
router.delete("/restaurant/availability/:id", async (req, res) => {
  const auth = getAuth(req);
  const ownerId = auth?.userId ?? "demo-owner";
  const { id } = DeleteAvailabilitySlotParams.parse({ id: Number(req.params.id) });

  const restaurant = await getRestaurantForOwner(ownerId);
  if (!restaurant) {
    return res.status(404).json({ error: "No restaurant found for this account" });
  }

  await db
    .delete(availabilitySlotsTable)
    .where(
      and(
        eq(availabilitySlotsTable.id, id),
        eq(availabilitySlotsTable.restaurantId, restaurant.id)
      )
    );

  return res.status(204).send();
});

// ─── GET /restaurant/blackouts ────────────────────────────────────────────────
router.get("/restaurant/blackouts", async (req, res) => {
  const auth = getAuth(req);
  const ownerId = auth?.userId ?? "demo-owner";

  const restaurant = await getRestaurantForOwner(ownerId);
  if (!restaurant) return res.json([]);

  const blackouts = await db
    .select()
    .from(blackoutsTable)
    .where(eq(blackoutsTable.restaurantId, restaurant.id))
    .orderBy(blackoutsTable.startDate);

  return res.json(blackouts);
});

// ─── POST /restaurant/blackouts ───────────────────────────────────────────────
router.post("/restaurant/blackouts", async (req, res) => {
  const auth = getAuth(req);
  const ownerId = auth?.userId ?? "demo-owner";
  const body = CreateBlackoutBody.parse(req.body);

  const restaurant = await getRestaurantForOwner(ownerId);
  if (!restaurant) {
    return res.status(404).json({ error: "No restaurant found for this account" });
  }

  const [blackout] = await db
    .insert(blackoutsTable)
    .values({
      restaurantId: restaurant.id,
      startDate: body.startDate,
      endDate: body.endDate,
      reason: body.reason,
    })
    .returning();

  return res.status(201).json(blackout);
});

// ─── DELETE /restaurant/blackouts/:id ────────────────────────────────────────
router.delete("/restaurant/blackouts/:id", async (req, res) => {
  const auth = getAuth(req);
  const ownerId = auth?.userId ?? "demo-owner";
  const { id } = DeleteBlackoutParams.parse({ id: Number(req.params.id) });

  const restaurant = await getRestaurantForOwner(ownerId);
  if (!restaurant) {
    return res.status(404).json({ error: "No restaurant found for this account" });
  }

  await db
    .delete(blackoutsTable)
    .where(
      and(eq(blackoutsTable.id, id), eq(blackoutsTable.restaurantId, restaurant.id))
    );

  return res.status(204).send();
});

// ─── GET /restaurant/menu ─────────────────────────────────────────────────────
router.get("/restaurant/menu", async (req, res) => {
  const auth = getAuth(req);
  const ownerId = auth?.userId ?? "demo-owner";

  const restaurant = await getRestaurantForOwner(ownerId);
  if (!restaurant) return res.json([]);

  const items = await db
    .select()
    .from(menuItemsTable)
    .where(eq(menuItemsTable.restaurantId, restaurant.id))
    .orderBy(menuItemsTable.category, menuItemsTable.name);

  return res.json(items);
});

// ─── POST /restaurant/menu ────────────────────────────────────────────────────
router.post("/restaurant/menu", async (req, res) => {
  const auth = getAuth(req);
  const ownerId = auth?.userId ?? "demo-owner";
  const body = CreateMenuItemBody.parse(req.body);

  const restaurant = await getRestaurantForOwner(ownerId);
  if (!restaurant) {
    return res.status(404).json({ error: "No restaurant found for this account" });
  }

  const [item] = await db
    .insert(menuItemsTable)
    .values({
      restaurantId: restaurant.id,
      name: body.name,
      description: body.description,
      price: body.price,
      category: body.category,
      dietaryTags: body.dietaryTags ?? [],
      isAvailable: body.isAvailable ?? true,
    })
    .returning();

  return res.status(201).json(item);
});

// ─── PATCH /restaurant/menu/:id ───────────────────────────────────────────────
router.patch("/restaurant/menu/:id", async (req, res) => {
  const auth = getAuth(req);
  const ownerId = auth?.userId ?? "demo-owner";
  const { id } = UpdateMenuItemParams.parse({ id: Number(req.params.id) });
  const body = UpdateMenuItemBody.parse(req.body);

  const restaurant = await getRestaurantForOwner(ownerId);
  if (!restaurant) {
    return res.status(404).json({ error: "No restaurant found for this account" });
  }

  const update: Record<string, unknown> = {};
  if (body.name !== undefined) update.name = body.name;
  if (body.description !== undefined) update.description = body.description;
  if (body.price !== undefined) update.price = body.price;
  if (body.category !== undefined) update.category = body.category;
  if (body.dietaryTags !== undefined) update.dietaryTags = body.dietaryTags;
  if (body.isAvailable !== undefined) update.isAvailable = body.isAvailable;

  const [updated] = await db
    .update(menuItemsTable)
    .set(update)
    .where(
      and(eq(menuItemsTable.id, id), eq(menuItemsTable.restaurantId, restaurant.id))
    )
    .returning();

  if (!updated) {
    return res.status(404).json({ error: "Menu item not found" });
  }

  return res.json(updated);
});

// ─── DELETE /restaurant/menu/:id ──────────────────────────────────────────────
router.delete("/restaurant/menu/:id", async (req, res) => {
  const auth = getAuth(req);
  const ownerId = auth?.userId ?? "demo-owner";
  const { id } = DeleteMenuItemParams.parse({ id: Number(req.params.id) });

  const restaurant = await getRestaurantForOwner(ownerId);
  if (!restaurant) {
    return res.status(404).json({ error: "No restaurant found for this account" });
  }

  await db
    .delete(menuItemsTable)
    .where(
      and(eq(menuItemsTable.id, id), eq(menuItemsTable.restaurantId, restaurant.id))
    );

  return res.status(204).send();
});

// ─── GET /restaurant/reservations ────────────────────────────────────────────
router.get("/restaurant/reservations", async (req, res) => {
  const auth = getAuth(req);
  const ownerId = auth?.userId ?? "demo-owner";
  const query = ListRestaurantReservationsQueryParams.parse(req.query);

  const restaurant = await getRestaurantForOwner(ownerId);
  if (!restaurant) return res.json([]);

  const reservations = await getReservationsWithOrders(
    restaurant.id,
    query.status ?? "all"
  );

  return res.json(reservations);
});

// ─── POST /restaurant/reservations/:id/accept ────────────────────────────────
router.post("/restaurant/reservations/:id/accept", async (req, res) => {
  const auth = getAuth(req);
  const ownerId = auth?.userId ?? "demo-owner";
  const { id } = AcceptReservationParams.parse({ id: Number(req.params.id) });

  const restaurant = await getRestaurantForOwner(ownerId);
  if (!restaurant) {
    return res.status(404).json({ error: "No restaurant found for this account" });
  }

  await db
    .update(restaurantReservationsTable)
    .set({ status: "accepted" })
    .where(
      and(
        eq(restaurantReservationsTable.id, id),
        eq(restaurantReservationsTable.restaurantId, restaurant.id)
      )
    );

  const reservation = await getReservationWithOrder(id);
  if (!reservation) {
    return res.status(404).json({ error: "Reservation not found" });
  }

  return res.json(reservation);
});

// ─── POST /restaurant/reservations/:id/decline ───────────────────────────────
router.post("/restaurant/reservations/:id/decline", async (req, res) => {
  const auth = getAuth(req);
  const ownerId = auth?.userId ?? "demo-owner";
  const { id } = DeclineReservationParams.parse({ id: Number(req.params.id) });

  const restaurant = await getRestaurantForOwner(ownerId);
  if (!restaurant) {
    return res.status(404).json({ error: "No restaurant found for this account" });
  }

  await db
    .update(restaurantReservationsTable)
    .set({ status: "declined" })
    .where(
      and(
        eq(restaurantReservationsTable.id, id),
        eq(restaurantReservationsTable.restaurantId, restaurant.id)
      )
    );

  const reservation = await getReservationWithOrder(id);
  if (!reservation) {
    return res.status(404).json({ error: "Reservation not found" });
  }

  return res.json(reservation);
});

// ─── Public: GET /restaurants/:restaurantId/availability ──────────────────────
router.get("/restaurants/:restaurantId/availability", async (req, res) => {
  const { restaurantId } = GetPublicAvailabilityParams.parse(req.params);

  const slots = await db
    .select()
    .from(availabilitySlotsTable)
    .where(eq(availabilitySlotsTable.restaurantId, restaurantId))
    .orderBy(availabilitySlotsTable.date, availabilitySlotsTable.time);

  return res.json(slots);
});

// ─── Public: GET /restaurants/:restaurantId/menu ──────────────────────────────
router.get("/restaurants/:restaurantId/menu", async (req, res) => {
  const { restaurantId } = GetPublicMenuParams.parse(req.params);

  const items = await db
    .select()
    .from(menuItemsTable)
    .where(
      and(
        eq(menuItemsTable.restaurantId, restaurantId),
        eq(menuItemsTable.isAvailable, true)
      )
    )
    .orderBy(menuItemsTable.category, menuItemsTable.name);

  return res.json(items);
});

export default router;
