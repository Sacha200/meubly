-- Seed LOCAL uniquement (rejoue par `supabase db reset`). Jamais applique en prod.
-- Donnees synthetiques : partenaire IKEA avec son UUID de prod, deux marchands de demo pour
-- tester l'affichage multi-offres. N'utilise que des colonnes qui survivent a la phase 2
-- (jamais offer.is_active). Aucun utilisateur : les tests en creent.

INSERT INTO public.category (category_id, label, parent_id) VALUES
  ('c0000000-0000-4000-8000-000000000001', 'Salon', NULL),
  ('c0000000-0000-4000-8000-000000000002', 'Canapes', 'c0000000-0000-4000-8000-000000000001'),
  ('c0000000-0000-4000-8000-000000000003', 'Chambre', NULL);

INSERT INTO public.partner (partner_id, name, website_base_url) VALUES
  ('8d2e3d7c-1f4a-4a2c-8c3f-0b9cf7f8e2a1', 'Ikea', 'https://www.ikea.com'),
  ('d0000000-0000-4000-8000-000000000001', 'Demo Meubles', 'https://demo-meubles.example'),
  ('d0000000-0000-4000-8000-000000000002', 'Demo Deco', 'https://demo-deco.example');

INSERT INTO public.furniture
  (furniture_id, title, description, size_width, size_height, size_depth, cached_min_price, cached_nb_offers)
VALUES
  ('f0000000-0000-4000-8000-000000000001', 'KIVIK canape 3 places', 'Canape 3 places, housse lavable', 228, 83, 95, 549, 3),
  ('f0000000-0000-4000-8000-000000000002', 'FRIHETEN canape d''angle convertible', 'Canape d''angle avec rangement', 230, 66, 151, 479, 2),
  ('f0000000-0000-4000-8000-000000000003', 'MALM cadre de lit', 'Cadre de lit haut, 2 rangements', NULL, NULL, NULL, 249, 2),
  ('f0000000-0000-4000-8000-000000000004', 'HEMNES commode 8 tiroirs', 'Commode en pin massif', NULL, NULL, NULL, 299, 1),
  ('f0000000-0000-4000-8000-000000000005', 'LACK table basse', 'Table basse legere', NULL, NULL, NULL, 29.99, 1),
  ('f0000000-0000-4000-8000-000000000006', 'BILLY bibliotheque', 'Bibliotheque blanche', NULL, NULL, NULL, 59.99, 1),
  -- Id hors norme RFC, comme 8 meubles de la prod : utilise par tests/db/reviews.api.db.test.js
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 'Table a manger extensible (140-200 cm)', 'Table extensible', NULL, NULL, NULL, 349, 1);

INSERT INTO public.furniture_category (furniture_id, category_id) VALUES
  ('f0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000002'),
  ('f0000000-0000-4000-8000-000000000002', 'c0000000-0000-4000-8000-000000000002'),
  ('f0000000-0000-4000-8000-000000000003', 'c0000000-0000-4000-8000-000000000003'),
  ('f0000000-0000-4000-8000-000000000004', 'c0000000-0000-4000-8000-000000000003'),
  ('f0000000-0000-4000-8000-000000000005', 'c0000000-0000-4000-8000-000000000001'),
  ('f0000000-0000-4000-8000-000000000006', 'c0000000-0000-4000-8000-000000000001'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 'c0000000-0000-4000-8000-000000000001');

-- Une offre IKEA par meuble, plus des offres de demo sur 3 meubles.
INSERT INTO public.offer (furniture_id, partner_id, external_title, url_website, price) VALUES
  ('f0000000-0000-4000-8000-000000000001', '8d2e3d7c-1f4a-4a2c-8c3f-0b9cf7f8e2a1', 'KIVIK canape 3 places', 'https://www.ikea.com/fr/fr/p/kivik', 599),
  ('f0000000-0000-4000-8000-000000000002', '8d2e3d7c-1f4a-4a2c-8c3f-0b9cf7f8e2a1', 'FRIHETEN canape d''angle', 'https://www.ikea.com/fr/fr/p/friheten', 499),
  ('f0000000-0000-4000-8000-000000000003', '8d2e3d7c-1f4a-4a2c-8c3f-0b9cf7f8e2a1', 'MALM cadre de lit', 'https://www.ikea.com/fr/fr/p/malm', 249),
  ('f0000000-0000-4000-8000-000000000004', '8d2e3d7c-1f4a-4a2c-8c3f-0b9cf7f8e2a1', 'HEMNES commode', 'https://www.ikea.com/fr/fr/p/hemnes', 299),
  ('f0000000-0000-4000-8000-000000000005', '8d2e3d7c-1f4a-4a2c-8c3f-0b9cf7f8e2a1', 'LACK table basse', 'https://www.ikea.com/fr/fr/p/lack', 29.99),
  ('f0000000-0000-4000-8000-000000000006', '8d2e3d7c-1f4a-4a2c-8c3f-0b9cf7f8e2a1', 'BILLY bibliotheque', 'https://www.ikea.com/fr/fr/p/billy', 59.99),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', '8d2e3d7c-1f4a-4a2c-8c3f-0b9cf7f8e2a1', 'Table extensible', 'https://www.ikea.com/fr/fr/p/table', 349),
  ('f0000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000001', 'Canape KIVIK 3 places', 'https://demo-meubles.example/kivik', 549),
  ('f0000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000002', 'KIVIK 3 places gris', 'https://demo-deco.example/kivik', 579),
  ('f0000000-0000-4000-8000-000000000002', 'd0000000-0000-4000-8000-000000000001', 'FRIHETEN angle convertible', 'https://demo-meubles.example/friheten', 479),
  ('f0000000-0000-4000-8000-000000000003', 'd0000000-0000-4000-8000-000000000002', 'Lit MALM blanc', 'https://demo-deco.example/malm', 259);
