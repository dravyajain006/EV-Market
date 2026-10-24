import { Router } from 'express';
import { AdminController } from './admin.controller.js';
import { authenticate, authorize } from '../../middleware/auth.js';

const router = Router();

// CSV export available to all authenticated users
router.get('/export-csv', authenticate, AdminController.exportCsv);

// Audit logs and User administration restricted to ADMIN
router.get('/users', authenticate, authorize(['ADMIN']), AdminController.listUsers);
router.patch('/users/:id', authenticate, authorize(['ADMIN']), AdminController.updateUser);
router.get('/audit-logs', authenticate, authorize(['ADMIN']), AdminController.getAuditLogs);

export default router;
