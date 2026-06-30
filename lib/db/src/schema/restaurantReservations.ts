import { pgTable, serial, text, integer, real, date, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const restaurantReservationsTable = pgTable("restaurant_reservations", {
  id: serial("id").primaryKey(),
  restaurantId: text("restaurant_id").notNull(),
  customerId: text("customer_id"),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email"),
  partySize: integer("party_size").notNull(),
  date: date("date", { mode: "string" }).notNull(),
  time: text("time").notNull(),
  confirmationCode: text("confirmation_code").notNull(),
  status: text("status").notNull().default("pending"),
  specialRequests: text("special_requests"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const reservationOrderItemsTable = pgTable("reservation_order_items", {
  id: serial("id").primaryKey(),
  reservationId: integer("reservation_id").notNull(),
  menuItemId: integer("menu_item_id").notNull(),
  menuItemName: text("menu_item_name").notNull(),
  price: real("price").notNull(),
  quantity: integer("quantity").notNull().default(1),
  notes: text("notes"),
});

export const insertReservationSchema = createInsertSchema(restaurantReservationsTable).omit({
  id: true,
  createdAt: true,
});
export const insertOrderItemSchema = createInsertSchema(reservationOrderItemsTable).omit({
  id: true,
});
export type InsertReservation = z.infer<typeof insertReservationSchema>;
export type RestaurantReservation = typeof restaurantReservationsTable.$inferSelect;
export type ReservationOrderItem = typeof reservationOrderItemsTable.$inferSelect;
