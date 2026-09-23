import { Router } from  "express";
import { subscribe } from "../controllers/subscription.controller.js";

import {upload} from "../middlewares/multer.middlewares.js"
import { verifyJWT } from "../middlewares/auth.middlewares.js";

const router = Router();
router.route("/subscribe/:channelId").get(verifyJWT, subscribe);

export default router;