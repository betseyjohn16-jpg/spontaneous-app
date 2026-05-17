import { Router } from "express";
import { MakeReservationBody } from "@workspace/api-zod";

const router = Router();

router.post("/reservations", (req, res) => {
  const body = MakeReservationBody.parse(req.body);

  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const code = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");

  const confirmation = {
    confirmationCode: code,
    restaurantName: body.restaurantName,
    partySize: body.partySize,
    reservationTime: body.reservationTime,
    message: `Your table for ${body.partySize} at ${body.restaurantName} is confirmed for ${body.reservationTime} tonight. A confirmation has been sent to your phone. Please arrive 10 minutes early.`,
  };

  res.json(confirmation);
});

export default router;
