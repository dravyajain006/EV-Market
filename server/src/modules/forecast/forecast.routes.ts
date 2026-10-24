import { Router } from 'express';
import { ForecastController } from './forecast.controller.js';
import { authenticate, authorize } from '../../middleware/auth.js';

const router = Router();

router.get('/', authenticate, ForecastController.getForecasts);
router.post('/calculate', authenticate, authorize(['ADMIN', 'ANALYST']), ForecastController.runForecast);

export default router;
