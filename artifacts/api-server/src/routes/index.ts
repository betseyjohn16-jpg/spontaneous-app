import { Router, type IRouter } from "express";
import healthRouter from "./health";
import suggestRouter from "./suggest";
import reservationsRouter from "./reservations";
import reviewsRouter from "./reviews";
import userRouter from "./user";
import subscriptionRouter from "./subscription";
import privacyRouter from "./privacy";
import deleteAccountRouter from "./deleteAccount";
import restaurantRouter from "./restaurant";

const router: IRouter = Router();

router.use(healthRouter);
router.use(privacyRouter);
router.use(deleteAccountRouter);
router.use(suggestRouter);
router.use(reservationsRouter);
router.use(reviewsRouter);
router.use(userRouter);
router.use(subscriptionRouter);
router.use(restaurantRouter);

export default router;
