import { Router } from 'express';
import { AnalyticsController } from './analytics.controller.js';

const router = Router();

router.get('/overview', AnalyticsController.getOverview);
router.get('/trends', AnalyticsController.getTrends);
router.get('/regions', AnalyticsController.getRegions);
router.get('/manufacturers', AnalyticsController.getManufacturers);
router.get('/global', AnalyticsController.getGlobal);

export default router;
