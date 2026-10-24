import { Request, Response, NextFunction } from 'express';
import { AdminService } from './admin.service.js';
import { sendSuccess } from '../../utils/apiResponse.js';

export class AdminController {
  static async listUsers(_req: Request, res: Response, next: NextFunction) {
    try {
      const users = await AdminService.listUsers();
      return sendSuccess(res, users, 'Users retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  static async updateUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { role, isActive } = req.body;
      const updated = await AdminService.updateUser(id, { role, isActive }, req.user?.id);
      return sendSuccess(res, updated, 'User updated successfully');
    } catch (error) {
      next(error);
    }
  }

  static async getAuditLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 100;
      const logs = await AdminService.getAuditLogs(limit);
      return sendSuccess(res, logs, 'Audit trail logs retrieved');
    } catch (error) {
      next(error);
    }
  }

  static async exportCsv(req: Request, res: Response, next: NextFunction) {
    try {
      const year = req.query.year ? parseInt(req.query.year as string, 10) : undefined;
      const regionId = req.query.regionId as string | undefined;
      const categoryId = req.query.categoryId as string | undefined;

      const csvData = await AdminService.exportRegistrationsCsv({ year, regionId, categoryId });
      const filename = `ev_registrations_export_${year || 'all'}_${Date.now()}.csv`;

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      return res.status(200).send(csvData);
    } catch (error) {
      next(error);
    }
  }
}
