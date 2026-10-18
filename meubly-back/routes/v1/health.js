import express from "express";

const router = express.Router();

/** Sonde de disponibilite (Render health check, CI). Ne touche pas la base. */
router.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

export default router;
