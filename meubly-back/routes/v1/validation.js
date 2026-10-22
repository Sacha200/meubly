import { validationResult } from "express-validator";

const PG_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Valide un identifiant au format uuid de Postgres (8-4-4-4-12 hexadecimal). isUUID() exige en
 * plus la version et la variante RFC, et refuse des ids que la base accepte (meubles de demo).
 * @param {import("express-validator").ValidationChain} chain ex. param("id"), body("furnitureId")
 */
export const isPgUuid = (chain) => chain.isString().matches(PG_UUID);

/** Repond 400 avec le detail des champs refuses par express-validator. */
export const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  return next();
};
