import { Router } from 'express';
import { PowerBIController } from './powerbi.controller.js';
import { authenticate } from '../../middleware/auth.js';

const router = Router();

router.get('/reports', authenticate, PowerBIController.getReports);
router.post('/embed-config', authenticate, PowerBIController.getEmbedConfig);

export default router;
