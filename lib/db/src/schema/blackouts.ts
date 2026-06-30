import { pgTable, serial, text, date, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const blackoutsTable = pgTable("blackouts", {
  id: serial("id").primaryKey(),
  restaurantId: text("restaurant_id").notNull(),
  startDate: date("start_date", { mode: "string" }).notNull(),
  endDate: date("end_date", { mode: "string" }).notNull(),
  reason: text("reason"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertBlackoutSchema = createInsertSchema(blackoutsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertBlackout = z.infer<typeof insertBlackoutSchema>;
export type Blackout = typeof blackoutsTable.$inferSelect;
