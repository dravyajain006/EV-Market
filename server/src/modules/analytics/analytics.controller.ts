import { Request, Response, NextFunction } from 'express';
import { AnalyticsService } from './analytics.service.js';
import { sendSuccess } from '../../utils/apiResponse.js';

export class AnalyticsController {
  static async getOverview(req: Request, res: Response, next: NextFunction) {
    try {
      const year = req.query.year ? parseInt(req.query.year as string, 10) : undefined;
      const regionId = req.query.regionId as string | undefined;
      const categoryId = req.query.categoryId as string | undefined;

      const data = await AnalyticsService.getOverview({ year, regionId, categoryId });
      return sendSuccess(res, data, 'Analytics overview retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  static async getTrends(req: Request, res: Response, next: NextFunction) {
    try {
      const regionId = req.query.regionId as string | undefined;
      const categoryId = req.query.categoryId as string | undefined;

      const data = await AnalyticsService.getTrends({ regionId, categoryId });
      return sendSuccess(res, data, 'Historical EV trends retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  static async getRegions(req: Request, res: Response, next: NextFunction) {
    try {
      const year = req.query.year ? parseInt(req.query.year as string, 10) : undefined;
      const zone = req.query.zone as string | undefined;

      const data = await AnalyticsService.getRegions({ year, zone });
      return sendSuccess(res, data, 'State-wise EV analytics retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  static async getManufacturers(req: Request, res: Response, next: NextFunction) {
    try {
      const year = req.query.year ? parseInt(req.query.year as string, 10) : undefined;
      const categoryCode = req.query.categoryCode as string | undefined;

      const data = await AnalyticsService.getManufacturers({ year, categoryCode });
      return sendSuccess(res, data, 'Manufacturer rankings retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  static async getGlobal(req: Request, res: Response, next: NextFunction) {
    try {
      const year = req.query.year ? parseInt(req.query.year as string, 10) : 2025;
      const data = await AnalyticsService.getGlobalComparison(year);
      return sendSuccess(res, data, 'Global EV benchmarks retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
}
