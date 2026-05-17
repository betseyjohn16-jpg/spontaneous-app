import { Router, type IRouter } from "express";
import healthRouter from "./health";
import suggestRouter from "./suggest";
import reservationsRouter from "./reservations";
import reviewsRouter from "./reviews";

const router: IRouter = Router();

router.use(healthRouter);
router.use(suggestRouter);
router.use(reservationsRouter);
router.use(reviewsRouter);

export default router;
