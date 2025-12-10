import { supabase } from "../supabase.js";

export const offerRepository = {
  async findByFurnitureId(furnitureId, searchQuery) {
    let query = supabase
      .from("Offers")
      .select("id, name_furniture, website, url_website, prices")
      .eq("offer_id", furnitureId); // Note: Route uses "offer_id" == furnitureId based on join logic? Or foreign key? Route line 93: .eq("offer_id", id). Schema says offer has furniture_id. Wait.
      // Route code: .eq("offer_id", id).  The parameter is `id` from `req.params`. The route is `/:id/offers`.
      // If `id` is furniture_id, the column in Offers should be `furniture_id`?
      // User's diagram shows Offer has `furniture_id`.
      // But the route code says `.eq("offer_id", id)`. This looks like a BUG or strict naming coupling (Offer's ID is the Furniture ID? One-to-One? But it's One-to-Many).
      // If Offer table has `offer_id` as PK, and `furniture_id` as FK.
      // Querying `offer_id` equal to `furniture_id` returns *one* offer if IDs match?
      // Diagram says: Offer has `offer_id` (PK) and `furniture_id` (FK).
      // Route implementation: `.eq("offer_id", id)`.
      // If `id` is the furniture ID, this query gets the offer with PK = furniture ID.
      // This implies 1:1 or misuse of IDs.
      // However, looking at the diagram, `Offer` *contains* `furniture_id`.
      // I suspect the route MEANT `.eq("furniture_id", id)`.
      // OR `offer_id` is actually the FK? The diagram shows `offer_id` as PK.
      // Let's assume the diagram is correct and the code MIGHT be wrong or `offer_id` is the FK column name (bad naming).
      // Schema diagram: Offer has `offer_id` (PK), `furniture_id` (FK).
      // I will assume for now I should use `furniture_id` if I want offers FOR a furniture.
      // But I must respect the existing codebase behavior unless I'm fixing a bug.
      // Existing code: `.eq("offer_id", id)` where id is `req.params.id` (product id).
      // If I change it, I might break it if `offer_id` IS the FK column.
      // I'll stick to what the code does: `.eq("offer_id", id)`. But I'll add a comment.
      
    if (searchQuery) {
      query = query.ilike("website", `%${searchQuery}%`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }
};
