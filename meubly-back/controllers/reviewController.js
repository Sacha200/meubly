import { reviewService } from "../services/reviewService.js";

export const reviewController = {
  async list(req, res, next) {
    try {
      const { page, limit } = req.query;
      res.status(200).json(await reviewService.listByFurniture(req.params.id, { page, limit }));
    } catch (error) {
      next(error);
    }
  },

  async getMine(req, res, next) {
    try {
      const review = await reviewService.getOwnReview(req.params.id, req.user.id);
      res.status(200).json({ review: review ?? null });
    } catch (error) {
      next(error);
    }
  },

  async upsert(req, res, next) {
    try {
      const result = await reviewService.upsertReview({
        furnitureId: req.params.id,
        userId: req.user.id,
        rating: Number(req.body.rating),
        comment: (req.body.comment ?? "").trim(),
      });
      res.status(result.action === "created" ? 201 : 200).json(result);
    } catch (error) {
      next(error);
    }
  },

  async deleteMine(req, res, next) {
    try {
      await reviewService.deleteOwnReview(req.params.id, req.user.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },

  async deleteAny(req, res, next) {
    try {
      await reviewService.deleteReview(req.params.reviewId);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },
};
