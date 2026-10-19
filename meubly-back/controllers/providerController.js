import { providerService } from "../services/providerService.js";

export const providerController = {
  async getAll(req, res, next) {
    try {
      const providers = await providerService.getAllProviders();
      res.status(200).json(providers);
    } catch (error) {
      next(error);
    }
  },

  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const provider = await providerService.getProviderById(id);
      res.status(200).json(provider);
    } catch (error) {
      next(error);
    }
  },

  async create(req, res, next) {
    try {
      const provider = await providerService.createProvider(req.body);
      res.status(201).json(provider);
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const { id } = req.params;
      const provider = await providerService.updateProvider(id, req.body);
      res.status(200).json(provider);
    } catch (error) {
      next(error);
    }
  },

  async delete(req, res, next) {
    try {
      const { id } = req.params;
      await providerService.deleteProvider(id);
      res.status(200).json({ message: "Provider deleted" });
    } catch (error) {
      next(error);
    }
  },

  async getAllOffers(req, res, next) {
    const { categoryId } = req.params;
    try {
      // Compare route aggregates offers from all providers
      const data = await providerService.compareCategory(categoryId);
      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  },
};
