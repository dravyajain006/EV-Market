import { Request, Response, NextFunction } from 'express';
import { ForecastService } from './forecast.service.js';
import { sendSuccess } from '../../utils/apiResponse.js';

export class ForecastController {
  static async getForecasts(_req: Request, res: Response, next: NextFunction) {
    try {
      const data = await ForecastService.getForecasts();
      return sendSuccess(res, data, 'Statistical forecast models retrieved');
    } catch (error) {
      next(error);
    }
  }

  static async runForecast(req: Request, res: Response, next: NextFunction) {
    try {
      const { horizonYears, alpha, beta } = req.body;
      const data = await ForecastService.computeForecast({
        horizonYears: horizonYears ? parseInt(horizonYears, 10) : 5,
        alpha: alpha ? parseFloat(alpha) : undefined,
        beta: beta ? parseFloat(beta) : undefined,
      });
      return sendSuccess(res, data, 'Time-series forecasting calculation executed successfully');
    } catch (error) {
      next(error);
    }
  }
}
