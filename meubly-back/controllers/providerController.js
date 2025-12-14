import { providerService } from "../services/providerService.js";

export const providerController = {
    async getAll(req, res) {
        try {
            const providers = await providerService.getAllProviders();
            res.status(200).json(providers);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    async getById(req, res) {
        try {
            const { id } = req.params;
            const provider = await providerService.getProviderById(id);
            res.status(200).json(provider);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    async create(req, res) {
        try {
            const provider = await providerService.createProvider(req.body);
            res.status(201).json(provider);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },

    async update(req, res) {
        try {
            const { id } = req.params;
            const provider = await providerService.updateProvider(id, req.body);
            res.status(200).json(provider);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },

    async delete(req, res) {
        try {
            const { id } = req.params;
            await providerService.deleteProvider(id);
            res.status(200).json({ message: "Provider deleted" });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    async getAllOffers(req, res) {
        const { categoryId } = req.params;
        try {
             // Compare route aggregates offers from all providers
             const data = await providerService.compareCategory(categoryId);
             res.status(200).json(data);
        } catch (error) {
             res.status(500).json({ error: error.message });
        }
    }
};
