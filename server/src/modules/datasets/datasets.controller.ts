import { Request, Response, NextFunction } from 'express';
import { DatasetsService } from './datasets.service.js';
import { sendSuccess } from '../../utils/apiResponse.js';
import { AppError } from '../../middleware/errorHandler.js';

export class DatasetsController {
  static async uploadAndPreview(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        throw new AppError('No CSV file was uploaded', 400);
      }

      const preview = await DatasetsService.previewCsv(req.file.path);
      return sendSuccess(res, {
        fileKey: req.file.filename,
        filePath: req.file.path,
        originalName: req.file.originalname,
        ...preview,
      }, 'File analyzed and preview generated');
    } catch (error) {
      next(error);
    }
  }

  static async commitImport(req: Request, res: Response, next: NextFunction) {
    try {
      const { filePath, datasetName, description, sourceUrl } = req.body;
      if (!filePath || !datasetName) {
        throw new AppError('filePath and datasetName are required to execute ingestion', 400);
      }

      const result = await DatasetsService.processCsvImport({
        filePath,
        datasetName,
        description,
        sourceUrl,
        userId: req.user?.id,
      });

      return sendSuccess(res, result, 'Dataset ingestion pipeline completed successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  static async listDatasets(_req: Request, res: Response, next: NextFunction) {
    try {
      const datasets = await DatasetsService.listDatasets();
      return sendSuccess(res, datasets, 'Datasets retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  static async getQualityReport(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const report = await DatasetsService.getDatasetQuality(id as string);
      return sendSuccess(res, report, 'Data quality audit report retrieved');
    } catch (error) {
      next(error);
    }
  }
}
