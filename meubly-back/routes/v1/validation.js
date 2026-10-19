import { validationResult } from "express-validator";

/** Repond 400 avec le detail des champs refuses par express-validator. */
export const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  return next();
};
