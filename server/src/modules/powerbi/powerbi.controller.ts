import { Request, Response, NextFunction } from 'express';
import { PowerBIService } from './powerbi.service.js';
import { sendSuccess } from '../../utils/apiResponse.js';

export class PowerBIController {
  static async getReports(_req: Request, res: Response, next: NextFunction) {
    try {
      const data = await PowerBIService.getReportCatalog();
      return sendSuccess(res, data, 'Power BI reports and DAX catalog retrieved');
    } catch (error) {
      next(error);
    }
  }

  static async getEmbedConfig(req: Request, res: Response, next: NextFunction) {
    try {
      const { reportId } = req.body;
      const data = await PowerBIService.getEmbedConfig(reportId || 'pbi-rep-001-exec', req.user?.id);
      return sendSuccess(res, data, 'Embed configuration generated successfully');
    } catch (error) {
      next(error);
    }
  }
}
