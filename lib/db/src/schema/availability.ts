import { pgTable, serial, text, integer, date, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const availabilitySlotsTable = pgTable("availability_slots", {
  id: serial("id").primaryKey(),
  restaurantId: text("restaurant_id").notNull(),
  date: date("date", { mode: "string" }).notNull(),
  time: text("time").notNull(),
  partyMin: integer("party_min").notNull().default(1),
  partyMax: integer("party_max").notNull().default(8),
  capacity: integer("capacity").notNull().default(1),
  booked: integer("booked").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertAvailabilitySlotSchema = createInsertSchema(availabilitySlotsTable).omit({
  id: true,
  booked: true,
  createdAt: true,
});
export type InsertAvailabilitySlot = z.infer<typeof insertAvailabilitySlotSchema>;
export type AvailabilitySlot = typeof availabilitySlotsTable.$inferSelect;
