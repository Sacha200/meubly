import { userService } from "../services/userService.js";

export const userController = {
  async list(req, res, next) {
    try {
      const { q, page = 1, limit = 20 } = req.query;
      res
        .status(200)
        .json(await userService.listUsers({ q, page: Number(page), limit: Number(limit) }));
    } catch (error) {
      next(error);
    }
  },

  async getById(req, res, next) {
    try {
      res.status(200).json(await userService.getUser(req.params.id));
    } catch (error) {
      next(error);
    }
  },

  async block(req, res, next) {
    try {
      await userService.blockUser(req.params.id, req.user.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },

  async unblock(req, res, next) {
    try {
      await userService.unblockUser(req.params.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },

  async delete(req, res, next) {
    try {
      await userService.deleteUser(req.params.id, req.user.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },
};
