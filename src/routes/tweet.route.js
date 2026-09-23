import { Router } from  "express";
import { deleteTweet, editTweet, tweetIt } from "../controllers/tweet.controllers.js";

import { verifyJWT } from "../middlewares/auth.middlewares.js";

const router = Router();
router.route("/postTweet").post(verifyJWT, tweetIt);
router.route("/editTweet/:tweetId").patch(verifyJWT, editTweet);
router.route("/deleteTweet/:tweetId").delete(verifyJWT, deleteTweet  );


export default router;