


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pgsodium";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pg_trgm" WITH SCHEMA "public";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
BEGIN
  INSERT INTO public.profile (user_id, email, username, lastname, role)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data ->> 'username',
    NEW.raw_user_meta_data ->> 'lastname',
    'USER'
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_user_email_update"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
BEGIN
  UPDATE public.profile SET email = NEW.email WHERE user_id = NEW.id;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_user_email_update"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."category" (
    "category_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "label" "text" NOT NULL,
    "cover_url" "text",
    "parent_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"())
);


ALTER TABLE "public"."category" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."favorite" (
    "user_id" "uuid" NOT NULL,
    "furniture_id" "uuid" NOT NULL,
    "added_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"())
);


ALTER TABLE "public"."favorite" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."furniture" (
    "furniture_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "cover_url" "text",
    "size_width" numeric,
    "size_height" numeric,
    "size_depth" numeric,
    "cached_min_price" numeric,
    "cached_nb_offers" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "ai_description" "text",
    "ai_tags" "text"[],
    "ai_style" "text",
    "ai_material" "text",
    "ai_category_suggestion" "text",
    "ai_scene_prompt" "text",
    "ai_enriched_at" timestamp with time zone
);


ALTER TABLE "public"."furniture" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."furniture_category" (
    "furniture_id" "uuid" NOT NULL,
    "category_id" "uuid" NOT NULL
);


ALTER TABLE "public"."furniture_category" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."furniture_image" (
    "image_id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "furniture_id" "uuid" NOT NULL,
    "url" "text" NOT NULL,
    "alt_text" "text",
    "type" "text",
    "position" integer DEFAULT 0 NOT NULL,
    "source" "text" DEFAULT 'ikea'::"text",
    "is_cover" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"())
);


ALTER TABLE "public"."furniture_image" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."offer" (
    "offer_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "external_title" "text",
    "url_website" "text" NOT NULL,
    "price" numeric NOT NULL,
    "furniture_id" "uuid",
    "partner_id" "uuid",
    "is_active" boolean DEFAULT true,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"())
);


ALTER TABLE "public"."offer" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."partner" (
    "partner_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "website_base_url" "text",
    "logo_url" "text",
    "is_active" boolean DEFAULT true,
    "api_key_hash" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"())
);


ALTER TABLE "public"."partner" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."partner_product" (
    "partner_product_id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "partner_id" "uuid" NOT NULL,
    "external_id" "text" NOT NULL,
    "external_url" "text",
    "external_title" "text",
    "raw_payload" "jsonb",
    "furniture_id" "uuid",
    "last_seen_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"())
);


ALTER TABLE "public"."partner_product" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profile" (
    "user_id" "uuid" NOT NULL,
    "username" "text",
    "email" character varying,
    "created_at" "date",
    "lastname" "text",
    "role" "text" DEFAULT 'USER'::"text" NOT NULL,
    CONSTRAINT "profile_role_check" CHECK (("role" = ANY (ARRAY['USER'::"text", 'ADMIN'::"text"])))
);


ALTER TABLE "public"."profile" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."review" (
    "review_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "furniture_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "rating" smallint NOT NULL,
    "comment" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "review_comment_check" CHECK ((("comment" IS NULL) OR ("char_length"("comment") <= 1000))),
    CONSTRAINT "review_rating_check" CHECK ((("rating" >= 1) AND ("rating" <= 5)))
);


ALTER TABLE "public"."review" OWNER TO "postgres";


ALTER TABLE ONLY "public"."category"
    ADD CONSTRAINT "Category_pkey" PRIMARY KEY ("category_id");



ALTER TABLE ONLY "public"."favorite"
    ADD CONSTRAINT "Favorite_pkey" PRIMARY KEY ("user_id", "furniture_id");



ALTER TABLE ONLY "public"."furniture_category"
    ADD CONSTRAINT "FurnitureCategory_pkey" PRIMARY KEY ("furniture_id", "category_id");



ALTER TABLE ONLY "public"."furniture_image"
    ADD CONSTRAINT "FurnitureImage_pkey" PRIMARY KEY ("image_id");



ALTER TABLE ONLY "public"."furniture"
    ADD CONSTRAINT "Furniture_pkey" PRIMARY KEY ("furniture_id");



ALTER TABLE ONLY "public"."partner_product"
    ADD CONSTRAINT "PartnerProduct_partner_id_external_id_key" UNIQUE ("partner_id", "external_id");



ALTER TABLE ONLY "public"."partner_product"
    ADD CONSTRAINT "PartnerProduct_pkey" PRIMARY KEY ("partner_product_id");



ALTER TABLE ONLY "public"."partner"
    ADD CONSTRAINT "Partner_pkey" PRIMARY KEY ("partner_id");



ALTER TABLE ONLY "public"."profile"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."offer"
    ADD CONSTRAINT "offers_pkey" PRIMARY KEY ("offer_id");



ALTER TABLE ONLY "public"."review"
    ADD CONSTRAINT "review_pkey" PRIMARY KEY ("review_id");



ALTER TABLE ONLY "public"."review"
    ADD CONSTRAINT "review_user_furniture_key" UNIQUE ("user_id", "furniture_id");



CREATE INDEX "idx_furniture_ai_enriched_at" ON "public"."furniture" USING "btree" ("ai_enriched_at") WHERE ("ai_enriched_at" IS NULL);



CREATE INDEX "idx_furniture_image_furniture_id" ON "public"."furniture_image" USING "btree" ("furniture_id", "position");



CREATE INDEX "idx_partnerproduct_furniture" ON "public"."partner_product" USING "btree" ("furniture_id");



CREATE INDEX "idx_partnerproduct_partner" ON "public"."partner_product" USING "btree" ("partner_id");



CREATE INDEX "review_furniture_id_idx" ON "public"."review" USING "btree" ("furniture_id");



ALTER TABLE ONLY "public"."category"
    ADD CONSTRAINT "Category_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."category"("category_id");



ALTER TABLE ONLY "public"."favorite"
    ADD CONSTRAINT "Favorite_furniture_id_fkey" FOREIGN KEY ("furniture_id") REFERENCES "public"."furniture"("furniture_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."favorite"
    ADD CONSTRAINT "Favorite_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."furniture_category"
    ADD CONSTRAINT "FurnitureCategory_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."category"("category_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."furniture_category"
    ADD CONSTRAINT "FurnitureCategory_furniture_id_fkey" FOREIGN KEY ("furniture_id") REFERENCES "public"."furniture"("furniture_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."furniture_image"
    ADD CONSTRAINT "FurnitureImage_furniture_id_fkey" FOREIGN KEY ("furniture_id") REFERENCES "public"."furniture"("furniture_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."partner_product"
    ADD CONSTRAINT "PartnerProduct_furniture_id_fkey" FOREIGN KEY ("furniture_id") REFERENCES "public"."furniture"("furniture_id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."partner_product"
    ADD CONSTRAINT "PartnerProduct_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "public"."partner"("partner_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."offer"
    ADD CONSTRAINT "offers_furniture_id_fkey" FOREIGN KEY ("furniture_id") REFERENCES "public"."furniture"("furniture_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."offer"
    ADD CONSTRAINT "offers_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "public"."partner"("partner_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profile"
    ADD CONSTRAINT "profile_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."review"
    ADD CONSTRAINT "review_furniture_id_fkey" FOREIGN KEY ("furniture_id") REFERENCES "public"."furniture"("furniture_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."review"
    ADD CONSTRAINT "review_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profile"("user_id") ON DELETE CASCADE;



CREATE POLICY "catalog_read" ON "public"."category" FOR SELECT TO "anon", "authenticated" USING (true);



CREATE POLICY "catalog_read" ON "public"."furniture" FOR SELECT TO "anon", "authenticated" USING (true);



CREATE POLICY "catalog_read" ON "public"."furniture_category" FOR SELECT TO "anon", "authenticated" USING (true);



CREATE POLICY "catalog_read" ON "public"."furniture_image" FOR SELECT TO "anon", "authenticated" USING (true);



CREATE POLICY "catalog_read" ON "public"."offer" FOR SELECT TO "anon", "authenticated" USING (true);



CREATE POLICY "catalog_read" ON "public"."partner" FOR SELECT TO "anon", "authenticated" USING (true);



CREATE POLICY "catalog_read" ON "public"."partner_product" FOR SELECT TO "anon", "authenticated" USING (true);



ALTER TABLE "public"."category" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."favorite" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "favorite_delete_own" ON "public"."favorite" FOR DELETE TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "favorite_insert_own" ON "public"."favorite" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "favorite_read_own" ON "public"."favorite" FOR SELECT TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



ALTER TABLE "public"."furniture" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."furniture_category" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."furniture_image" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."offer" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."partner" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."partner_product" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profile" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "profile_read_own" ON "public"."profile" FOR SELECT TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



ALTER TABLE "public"."review" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "review_delete_own" ON "public"."review" FOR DELETE TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "review_insert_own" ON "public"."review" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "review_read" ON "public"."review" FOR SELECT TO "anon", "authenticated" USING (true);



CREATE POLICY "review_update_own" ON "public"."review" FOR UPDATE TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_in"("cstring") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_in"("cstring") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_in"("cstring") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_in"("cstring") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_out"("public"."gtrgm") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_out"("public"."gtrgm") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_out"("public"."gtrgm") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_out"("public"."gtrgm") TO "service_role";














































































































































































GRANT ALL ON FUNCTION "public"."gin_extract_query_trgm"("text", "internal", smallint, "internal", "internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_query_trgm"("text", "internal", smallint, "internal", "internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_query_trgm"("text", "internal", smallint, "internal", "internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_query_trgm"("text", "internal", smallint, "internal", "internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_value_trgm"("text", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_value_trgm"("text", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_value_trgm"("text", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_value_trgm"("text", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_trgm_consistent"("internal", smallint, "text", integer, "internal", "internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_trgm_consistent"("internal", smallint, "text", integer, "internal", "internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_trgm_consistent"("internal", smallint, "text", integer, "internal", "internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_trgm_consistent"("internal", smallint, "text", integer, "internal", "internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_trgm_triconsistent"("internal", smallint, "text", integer, "internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_trgm_triconsistent"("internal", smallint, "text", integer, "internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_trgm_triconsistent"("internal", smallint, "text", integer, "internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_trgm_triconsistent"("internal", smallint, "text", integer, "internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_compress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_compress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_compress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_compress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_consistent"("internal", "text", smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_consistent"("internal", "text", smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_consistent"("internal", "text", smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_consistent"("internal", "text", smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_decompress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_decompress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_decompress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_decompress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_distance"("internal", "text", smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_distance"("internal", "text", smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_distance"("internal", "text", smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_distance"("internal", "text", smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_options"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_options"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_options"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_options"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_penalty"("internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_penalty"("internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_penalty"("internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_penalty"("internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_picksplit"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_picksplit"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_picksplit"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_picksplit"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_same"("public"."gtrgm", "public"."gtrgm", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_same"("public"."gtrgm", "public"."gtrgm", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_same"("public"."gtrgm", "public"."gtrgm", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_same"("public"."gtrgm", "public"."gtrgm", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_union"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_union"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_union"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_union"("internal", "internal") TO "service_role";



REVOKE ALL ON FUNCTION "public"."handle_new_user"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."handle_user_email_update"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."handle_user_email_update"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_limit"(real) TO "postgres";
GRANT ALL ON FUNCTION "public"."set_limit"(real) TO "anon";
GRANT ALL ON FUNCTION "public"."set_limit"(real) TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_limit"(real) TO "service_role";



GRANT ALL ON FUNCTION "public"."show_limit"() TO "postgres";
GRANT ALL ON FUNCTION "public"."show_limit"() TO "anon";
GRANT ALL ON FUNCTION "public"."show_limit"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."show_limit"() TO "service_role";



GRANT ALL ON FUNCTION "public"."show_trgm"("text") TO "postgres";
GRANT ALL ON FUNCTION "public"."show_trgm"("text") TO "anon";
GRANT ALL ON FUNCTION "public"."show_trgm"("text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."show_trgm"("text") TO "service_role";



GRANT ALL ON FUNCTION "public"."similarity"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."similarity"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."similarity"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."similarity"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."similarity_dist"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."similarity_dist"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."similarity_dist"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."similarity_dist"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."similarity_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."similarity_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."similarity_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."similarity_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity_commutator_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_commutator_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_commutator_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_commutator_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_commutator_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_commutator_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_commutator_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_commutator_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity_commutator_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity_commutator_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity_commutator_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity_commutator_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity_dist_commutator_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_commutator_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_commutator_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_commutator_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity_dist_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity_op"("text", "text") TO "service_role";



























GRANT SELECT,REFERENCES,TRIGGER ON TABLE "public"."category" TO "anon";
GRANT SELECT,REFERENCES,TRIGGER ON TABLE "public"."category" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."category" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER ON TABLE "public"."favorite" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."favorite" TO "service_role";



GRANT SELECT,REFERENCES,TRIGGER ON TABLE "public"."furniture" TO "anon";
GRANT SELECT,REFERENCES,TRIGGER ON TABLE "public"."furniture" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."furniture" TO "service_role";



GRANT SELECT,REFERENCES,TRIGGER ON TABLE "public"."furniture_category" TO "anon";
GRANT SELECT,REFERENCES,TRIGGER ON TABLE "public"."furniture_category" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."furniture_category" TO "service_role";



GRANT SELECT,REFERENCES,TRIGGER ON TABLE "public"."furniture_image" TO "anon";
GRANT SELECT,REFERENCES,TRIGGER ON TABLE "public"."furniture_image" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."furniture_image" TO "service_role";



GRANT SELECT,REFERENCES,TRIGGER ON TABLE "public"."offer" TO "anon";
GRANT SELECT,REFERENCES,TRIGGER ON TABLE "public"."offer" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."offer" TO "service_role";



GRANT SELECT,REFERENCES,TRIGGER ON TABLE "public"."partner" TO "anon";
GRANT SELECT,REFERENCES,TRIGGER ON TABLE "public"."partner" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."partner" TO "service_role";



GRANT SELECT,REFERENCES,TRIGGER ON TABLE "public"."partner_product" TO "anon";
GRANT SELECT,REFERENCES,TRIGGER ON TABLE "public"."partner_product" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."partner_product" TO "service_role";



GRANT SELECT,REFERENCES,TRIGGER ON TABLE "public"."profile" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."profile" TO "service_role";



GRANT SELECT,REFERENCES,TRIGGER ON TABLE "public"."review" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,UPDATE ON TABLE "public"."review" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."review" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLES TO "service_role";
































-- Ajout manuel : triggers sur auth.users (hors du perimetre de `db dump`, schema public seul).
-- Releves en prod le 2026-11-04 via pg_get_triggerdef.
DROP TRIGGER IF EXISTS "on_auth_user_created" ON "auth"."users";
CREATE TRIGGER "on_auth_user_created" AFTER INSERT ON "auth"."users"
  FOR EACH ROW EXECUTE FUNCTION "public"."handle_new_user"();

DROP TRIGGER IF EXISTS "on_auth_user_email_updated" ON "auth"."users";
CREATE TRIGGER "on_auth_user_email_updated" AFTER UPDATE OF "email" ON "auth"."users"
  FOR EACH ROW WHEN (("old"."email")::"text" IS DISTINCT FROM ("new"."email")::"text")
  EXECUTE FUNCTION "public"."handle_user_email_update"();

-- Ajout manuel : droits effectifs de la prod (REVOKE de 009_rls absents du dump, car pg_dump
-- compare aux droits par defaut). Genere par `supabase db diff --linked -s public` le 2026-11-04.
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" REVOKE ALL ON TABLES FROM "anon";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" REVOKE ALL ON TABLES FROM "authenticated";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" REVOKE ALL ON TABLES FROM "service_role";

REVOKE ALL ON FUNCTION "public"."handle_new_user"() FROM "anon";

REVOKE ALL ON FUNCTION "public"."handle_new_user"() FROM "authenticated";

REVOKE ALL ON FUNCTION "public"."handle_user_email_update"() FROM "anon";

REVOKE ALL ON FUNCTION "public"."handle_user_email_update"() FROM "authenticated";

REVOKE ALL ON TABLE "public"."favorite" FROM "anon";

REVOKE ALL ON TABLE "public"."profile" FROM "anon";

REVOKE ALL ON TABLE "public"."category" FROM "anon";

GRANT REFERENCES, SELECT, TRIGGER ON TABLE "public"."category" TO "anon";

REVOKE ALL ON TABLE "public"."category" FROM "authenticated";

GRANT REFERENCES, SELECT, TRIGGER ON TABLE "public"."category" TO "authenticated";

REVOKE ALL ON TABLE "public"."category" FROM "service_role";

GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."category" TO "service_role";

REVOKE ALL ON TABLE "public"."favorite" FROM "authenticated";

GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER ON TABLE "public"."favorite" TO "authenticated";

REVOKE ALL ON TABLE "public"."favorite" FROM "service_role";

GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."favorite" TO "service_role";

REVOKE ALL ON TABLE "public"."furniture" FROM "anon";

GRANT REFERENCES, SELECT, TRIGGER ON TABLE "public"."furniture" TO "anon";

REVOKE ALL ON TABLE "public"."furniture" FROM "authenticated";

GRANT REFERENCES, SELECT, TRIGGER ON TABLE "public"."furniture" TO "authenticated";

REVOKE ALL ON TABLE "public"."furniture" FROM "service_role";

GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."furniture" TO "service_role";

REVOKE ALL ON TABLE "public"."furniture_category" FROM "anon";

GRANT REFERENCES, SELECT, TRIGGER ON TABLE "public"."furniture_category" TO "anon";

REVOKE ALL ON TABLE "public"."furniture_category" FROM "authenticated";

GRANT REFERENCES, SELECT, TRIGGER ON TABLE "public"."furniture_category" TO "authenticated";

REVOKE ALL ON TABLE "public"."furniture_category" FROM "service_role";

GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."furniture_category" TO "service_role";

REVOKE ALL ON TABLE "public"."furniture_image" FROM "anon";

GRANT REFERENCES, SELECT, TRIGGER ON TABLE "public"."furniture_image" TO "anon";

REVOKE ALL ON TABLE "public"."furniture_image" FROM "authenticated";

GRANT REFERENCES, SELECT, TRIGGER ON TABLE "public"."furniture_image" TO "authenticated";

REVOKE ALL ON TABLE "public"."furniture_image" FROM "service_role";

GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."furniture_image" TO "service_role";

REVOKE ALL ON TABLE "public"."offer" FROM "anon";

GRANT REFERENCES, SELECT, TRIGGER ON TABLE "public"."offer" TO "anon";

REVOKE ALL ON TABLE "public"."offer" FROM "authenticated";

GRANT REFERENCES, SELECT, TRIGGER ON TABLE "public"."offer" TO "authenticated";

REVOKE ALL ON TABLE "public"."offer" FROM "service_role";

GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."offer" TO "service_role";

REVOKE ALL ON TABLE "public"."partner" FROM "anon";

GRANT REFERENCES, SELECT, TRIGGER ON TABLE "public"."partner" TO "anon";

REVOKE ALL ON TABLE "public"."partner" FROM "authenticated";

GRANT REFERENCES, SELECT, TRIGGER ON TABLE "public"."partner" TO "authenticated";

REVOKE ALL ON TABLE "public"."partner" FROM "service_role";

GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."partner" TO "service_role";

REVOKE ALL ON TABLE "public"."partner_product" FROM "anon";

GRANT REFERENCES, SELECT, TRIGGER ON TABLE "public"."partner_product" TO "anon";

REVOKE ALL ON TABLE "public"."partner_product" FROM "authenticated";

GRANT REFERENCES, SELECT, TRIGGER ON TABLE "public"."partner_product" TO "authenticated";

REVOKE ALL ON TABLE "public"."partner_product" FROM "service_role";

GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."partner_product" TO "service_role";

REVOKE ALL ON TABLE "public"."profile" FROM "authenticated";

GRANT REFERENCES, SELECT, TRIGGER ON TABLE "public"."profile" TO "authenticated";

REVOKE ALL ON TABLE "public"."profile" FROM "service_role";

GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."profile" TO "service_role";

REVOKE ALL ON TABLE "public"."review" FROM "anon";

GRANT REFERENCES, SELECT, TRIGGER ON TABLE "public"."review" TO "anon";

REVOKE ALL ON TABLE "public"."review" FROM "authenticated";

GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, UPDATE ON TABLE "public"."review" TO "authenticated";

REVOKE ALL ON TABLE "public"."review" FROM "service_role";

GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."review" TO "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLES TO "anon";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLES TO "authenticated";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLES TO "postgres";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLES TO "service_role";
