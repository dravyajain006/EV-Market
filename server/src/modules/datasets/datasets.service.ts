import fs from 'fs';
import prisma from '../../config/db.js';
import { AppError } from '../../middleware/errorHandler.js';
import { calculateDataCompleteness, calculateEvPenetration, calculateYoyGrowth } from '../../utils/formulas.js';

export interface ColumnMapping {
  state_code: string;
  state_name?: string;
  zone?: string;
  category: string;
  year: string;
  ev_registrations: string;
  total_vehicle_registrations: string;
}

export class DatasetsService {
  /**
   * Preview uploaded CSV file rows and columns
   */
  static async previewCsv(filePath: string, maxRows = 10) {
    if (!fs.existsSync(filePath)) {
      throw new AppError('Uploaded file not found on server', 404);
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.trim().split('\n').map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length < 1) {
      throw new AppError('The uploaded CSV file is empty', 400);
    }

    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    const previewRows: Record<string, string>[] = [];

    const limit = Math.min(lines.length, maxRows + 1);
    for (let i = 1; i < limit; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
      const rowObj: Record<string, string> = {};
      headers.forEach((h, idx) => {
        rowObj[h] = values[idx] || '';
      });
      previewRows.push(rowObj);
    }

    return {
      headers,
      totalRows: lines.length - 1,
      preview: previewRows,
    };
  }

  /**
   * Execute Safe Ingestion Pipeline with full transactional rollback & validation reporting
   */
  static async processCsvImport(params: {
    filePath: string;
    datasetName: string;
    description?: string;
    sourceUrl?: string;
    userId?: string;
  }) {
    const { filePath, datasetName, description, sourceUrl, userId } = params;

    if (!fs.existsSync(filePath)) {
      throw new AppError('File not found for processing', 404);
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.trim().split('\n').map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length < 2) {
      throw new AppError('CSV must contain at least one header row and one data record', 400);
    }

    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    const requiredColumns = ['state_code', 'category', 'year', 'ev_registrations', 'total_vehicle_registrations'];
    const missingColumns = requiredColumns.filter(c => !headers.includes(c));

    if (missingColumns.length > 0) {
      throw new AppError(`Missing mandatory schema columns: ${missingColumns.join(', ')}`, 400);
    }

    // Prepare Ingestion tracking job
    const dataset = await prisma.dataset.create({
      data: {
        name: datasetName,
        description: description || 'Batch imported registration dataset',
        sourceUrl: sourceUrl || 'CSV_USER_INGESTION',
        rowCount: lines.length - 1,
        status: 'PROCESSING',
        uploadedById: userId,
      },
    });

    const importJob = await prisma.importJob.create({
      data: {
        datasetId: dataset.id,
        fileName: filePath.split(/[\\/]/).pop() || 'upload.csv',
        status: 'PROCESSING',
        totalRows: lines.length - 1,
        validRows: 0,
        errorRows: 0,
      },
    });

    const regions = await prisma.dimRegion.findMany();
    const categories = await prisma.dimCategory.findMany();
    const regionMap = new Map(regions.map(r => [r.stateCode.toUpperCase(), r.id]));
    const categoryMap = new Map(categories.map(c => [c.categoryCode.toUpperCase(), c.id]));

    const errors: { row: number; column: string; value: string; code: string; message: string }[] = [];
    const validRecords: any[] = [];
    let duplicates = 0;
    let missingValues = 0;
    const seenGrains = new Set<string>();

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
      const row: Record<string, string> = {};
      headers.forEach((h, idx) => {
        row[h] = values[idx] || '';
      });

      const rowNum = i + 1;
      const stateCode = row.state_code?.toUpperCase();
      const catCode = row.category?.toUpperCase();
      const yearStr = row.year;
      const evStr = row.ev_registrations;
      const totalStr = row.total_vehicle_registrations;

      // Validation 1: Required fields
      if (!stateCode || !catCode || !yearStr || !evStr || !totalStr) {
        missingValues++;
        errors.push({
          row: rowNum,
          column: 'ALL',
          value: lines[i],
          code: 'MISSING_REQUIRED_FIELDS',
          message: 'One or more mandatory fields are empty',
        });
        continue;
      }

      // Validation 2: Foreign key checks
      const regionId = regionMap.get(stateCode);
      if (!regionId) {
        errors.push({
          row: rowNum,
          column: 'state_code',
          value: stateCode,
          code: 'INVALID_REGION',
          message: `State code '${stateCode}' is not registered in dimensional dictionary`,
        });
        continue;
      }

      const categoryId = categoryMap.get(catCode);
      if (!categoryId) {
        errors.push({
          row: rowNum,
          column: 'category',
          value: catCode,
          code: 'INVALID_CATEGORY',
          message: `Category code '${catCode}' is invalid. Allowed: 2W, 3W, 4W, BUS, COMMERCIAL`,
        });
        continue;
      }

      // Validation 3: Numbers & ranges
      const year = parseInt(yearStr, 10);
      const evReg = parseInt(evStr, 10);
      const totalReg = parseInt(totalStr, 10);

      if (isNaN(year) || year < 2010 || year > 2035) {
        errors.push({
          row: rowNum,
          column: 'year',
          value: yearStr,
          code: 'INVALID_YEAR_RANGE',
          message: `Year '${yearStr}' must be a 4-digit year between 2010 and 2035`,
        });
        continue;
      }

      if (isNaN(evReg) || evReg < 0) {
        errors.push({
          row: rowNum,
          column: 'ev_registrations',
          value: evStr,
          code: 'INVALID_NUMERIC_VALUE',
          message: 'EV registrations must be a non-negative integer',
        });
        continue;
      }

      if (isNaN(totalReg) || totalReg <= 0) {
        errors.push({
          row: rowNum,
          column: 'total_vehicle_registrations',
          value: totalStr,
          code: 'INVALID_TOTAL_COUNT',
          message: 'Total vehicle registrations must be greater than zero',
        });
        continue;
      }

      if (evReg > totalReg) {
        errors.push({
          row: rowNum,
          column: 'ev_registrations',
          value: `${evReg} > ${totalReg}`,
          code: 'DENOMINATOR_VIOLATION',
          message: 'EV registrations cannot exceed total vehicle registrations for the same period',
        });
        continue;
      }

      // Validation 4: Duplicate grain check
      const grainKey = `${regionId}_${categoryId}_${year}`;
      if (seenGrains.has(grainKey)) {
        duplicates++;
        errors.push({
          row: rowNum,
          column: 'GRAIN',
          value: grainKey,
          code: 'DUPLICATE_GRAIN_IN_FILE',
          message: `Multiple records for same Region (${stateCode}), Category (${catCode}), and Year (${year}) found`,
        });
        continue;
      }
      seenGrains.add(grainKey);

      const penPct = calculateEvPenetration(evReg, totalReg);

      validRecords.push({
        regionId,
        categoryId,
        year,
        evRegistrations: evReg,
        totalVehicleRegistrations: totalReg,
        evPenetrationPct: penPct,
        dataSource: datasetName,
      });
    }

    // Safe Transactional Execution
    if (errors.length > 0 && validRecords.length === 0) {
      // Entire file failed
      await prisma.$transaction([
        prisma.importJob.update({
          where: { id: importJob.id },
          data: {
            status: 'FAILED',
            errorRows: errors.length,
            completedAt: new Date(),
            errors: {
              createMany: {
                data: errors.map(e => ({
                  rowNumber: e.row,
                  column: e.column,
                  value: e.value,
                  errorCode: e.code,
                  errorMessage: e.message,
                })),
              },
            },
          },
        }),
        prisma.dataset.update({
          where: { id: dataset.id },
          data: { status: 'FAILED' },
        }),
      ]);

      throw new AppError(`Import rejected: ${errors.length} validation violations detected. No records were committed.`, 422, errors);
    }

    // Commit valid records inside safe database transaction
    await prisma.$transaction(async (tx) => {
      for (const rec of validRecords) {
        await tx.factEvRegistration.upsert({
          where: {
            regionId_categoryId_year: {
              regionId: rec.regionId,
              categoryId: rec.categoryId,
              year: rec.year,
            },
          },
          update: {
            evRegistrations: rec.evRegistrations,
            totalVehicleRegistrations: rec.totalVehicleRegistrations,
            evPenetrationPct: rec.evPenetrationPct,
          },
          create: rec,
        });
      }

      // Record any partial errors
      if (errors.length > 0) {
        await tx.importError.createMany({
          data: errors.map(e => ({
            importJobId: importJob.id,
            rowNumber: e.row,
            column: e.column,
            value: e.value,
            errorCode: e.code,
            errorMessage: e.message,
          })),
        });
      }

      await tx.importJob.update({
        where: { id: importJob.id },
        data: {
          status: errors.length > 0 ? 'PARTIAL_SUCCESS' : 'COMPLETED',
          validRows: validRecords.length,
          errorRows: errors.length,
          completedAt: new Date(),
        },
      });

      const totalExpected = (lines.length - 1) * requiredColumns.length;
      const validFieldsCount = validRecords.length * requiredColumns.length;
      const completenessScore = calculateDataCompleteness(validFieldsCount, totalExpected);

      await tx.dataQualityReport.create({
        data: {
          datasetId: dataset.id,
          completenessScore,
          duplicateCount: duplicates,
          missingValueCount: missingValues,
          validationScore: Number(((validRecords.length / (lines.length - 1)) * 100).toFixed(2)),
          summary: `Successfully validated ${validRecords.length}/${lines.length - 1} records. Integrity score: ${completenessScore}%.`,
        },
      });

      await tx.dataset.update({
        where: { id: dataset.id },
        data: {
          status: 'ACTIVE',
          rowCount: validRecords.length,
        },
      });

      if (userId) {
        await tx.auditLog.create({
          data: {
            userId,
            action: 'DATASET_INGESTED',
            entity: 'Dataset',
            entityId: dataset.id,
            details: `Imported '${datasetName}' with ${validRecords.length} committed records and ${errors.length} validation flags.`,
          },
        });
      }
    });

    return {
      datasetId: dataset.id,
      importJobId: importJob.id,
      totalRows: lines.length - 1,
      validRows: validRecords.length,
      errorRows: errors.length,
      errors: errors.slice(0, 25), // preview top 25 errors
    };
  }

  /**
   * List all datasets with their import status & quality reports
   */
  static async listDatasets() {
    return prisma.dataset.findMany({
      include: {
        qualityReports: {
          orderBy: { generatedAt: 'desc' },
          take: 1,
        },
        importJobs: {
          orderBy: { startedAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get Dataset Quality Report
   */
  static async getDatasetQuality(id: string) {
    const dataset = await prisma.dataset.findUnique({
      where: { id },
      include: {
        qualityReports: {
          orderBy: { generatedAt: 'desc' },
        },
        importJobs: {
          include: {
            errors: {
              take: 100,
            },
          },
        },
      },
    });

    if (!dataset) {
      throw new AppError('Dataset not found', 404);
    }

    return dataset;
  }
}
