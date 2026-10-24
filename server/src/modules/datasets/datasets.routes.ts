import { Router } from 'express';
import { DatasetsController } from './datasets.controller.js';
import { authenticate, authorize } from '../../middleware/auth.js';
import { upload } from '../../middleware/upload.js';

const router = Router();

router.get('/', authenticate, DatasetsController.listDatasets);
router.get('/:id/quality', authenticate, DatasetsController.getQualityReport);
router.post('/upload', authenticate, authorize(['ADMIN', 'ANALYST']), upload.single('file'), DatasetsController.uploadAndPreview);
router.post('/commit', authenticate, authorize(['ADMIN', 'ANALYST']), DatasetsController.commitImport);

export default router;
