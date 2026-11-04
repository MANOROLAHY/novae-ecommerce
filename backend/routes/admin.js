import { Router } from "express";
import { login, logoutToken } from "../middleware/adminAuth.js";

const router = Router();

router.post("/login", (req, res) => {
  const { password } = req.body;
  const token = login(password);
  if (!token) {
    return res.status(401).json({ error: "Mot de passe incorrect" });
  }
  res.json({ token });
});

router.post("/logout", (req, res) => {
  logoutToken(req.headers["x-admin-token"]);
  res.json({ success: true });
});

export default router;
