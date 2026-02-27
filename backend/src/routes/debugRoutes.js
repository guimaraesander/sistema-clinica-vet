import { Router } from "express";
import { listDebugUsers } from "../controllers/debugController.js";

const router = Router();

router.get("/users", listDebugUsers);

export default router;