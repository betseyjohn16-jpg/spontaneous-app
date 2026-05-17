import { Router, type IRouter } from "express";
import healthRouter from "./health";
import suggestRouter from "./suggest";
import reservationsRouter from "./reservations";

const router: IRouter = Router();

router.use(healthRouter);
router.use(suggestRouter);
router.use(reservationsRouter);

export default router;
