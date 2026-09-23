import { Router } from  "express";
import { likevideo, liketweet, getVideoLikeCount, gettweetLikeCount } from "../controllers/like.controllers.js";

import { verifyJWT } from "../middlewares/auth.middlewares.js";

const router = Router();

router.route("/likevideo/:videoid").get(verifyJWT,likevideo);
router.route("/liketweet/:tweetid").get(verifyJWT,liketweet);
router.route("/getVideoLikeCount/:videoId").get(verifyJWT, getVideoLikeCount);
router.route("/gettweetLikeCount/:tweetId").get(verifyJWT, gettweetLikeCount);


export default router