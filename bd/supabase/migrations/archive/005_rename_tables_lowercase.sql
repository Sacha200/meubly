-- Migration 005: Renommage des tables en snake_case minuscules
-- À exécuter dans Supabase → SQL Editor

ALTER TABLE "Favorite"          RENAME TO favorite;
ALTER TABLE "Furniture"         RENAME TO furniture;
ALTER TABLE "User"              RENAME TO profile;
ALTER TABLE "Partner"           RENAME TO partner;
ALTER TABLE "Category"          RENAME TO category;
ALTER TABLE "FurnitureCategory" RENAME TO furniture_category;
ALTER TABLE "FurnitureImage"    RENAME TO furniture_image;
ALTER TABLE "PartnerProduct"    RENAME TO partner_product;
ALTER TABLE "offers"            RENAME TO offer;
ALTER TABLE "Reviews"           RENAME TO review;
