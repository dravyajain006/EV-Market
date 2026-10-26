import prisma from '../../config/db.js';
import { AppError } from '../../middleware/errorHandler.js';

export class AdminService {
  /**
   * List users for administration
   */
  static async listUsers() {
    return prisma.user.findMany({
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        department: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: { sessions: true, auditLogs: true, datasets: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Update User Role or Status
   */
  static async updateUser(id: string, data: { role?: string; isActive?: boolean }, adminUserId?: string) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new AppError('User not found', 404);

    const protectedAdmins = ['admindravya@ev', 'adminkaran@ev', 'admin@evmarket.internal'];
    if (protectedAdmins.includes(user.email) && data.isActive === false) {
      throw new AppError('Primary System Administrator accounts cannot be deactivated.', 400);
    }

    const updated = await prisma.user.update({
      where: { id },
      data,
      select: { id: true, email: true, fullName: true, role: true, isActive: true },
    });

    if (adminUserId) {
      await prisma.auditLog.create({
        data: {
          userId: adminUserId,
          action: 'USER_PERMISSION_MODIFIED',
          entity: 'User',
          entityId: id,
          details: `Updated user ${user.email} (Role: ${data.role || user.role}, Active: ${data.isActive ?? user.isActive})`,
        },
      });
    }

    return updated;
  }

  /**
   * Get Audit Logs
   */
  static async getAuditLogs(limit = 100) {
    return prisma.auditLog.findMany({
      include: {
        user: {
          select: { email: true, fullName: true, role: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Generate Clean CSV string of filtered analytical records for export
   */
  static async exportRegistrationsCsv(filters?: { year?: number; regionId?: string; categoryId?: string }) {
    const where: any = {};
    if (filters?.year) where.year = filters.year;
    if (filters?.regionId) where.regionId = filters.regionId;
    if (filters?.categoryId) where.categoryId = filters.categoryId;

    const records = await prisma.factEvRegistration.findMany({
      where,
      include: {
        region: true,
        category: true,
      },
      orderBy: [{ year: 'desc' }, { regionId: 'asc' }],
    });

    const headers = [
      'State Code',
      'State Name',
      'Zone',
      'Vehicle Category',
      'Category Code',
      'Year',
      'EV Registrations',
      'Total Vehicle Registrations',
      'EV Penetration %',
      'YoY Growth %',
      'Data Source',
    ];

    const rows = records.map(r => [
      `"${r.region.stateCode}"`,
      `"${r.region.stateName}"`,
      `"${r.region.zone}"`,
      `"${r.category.categoryName}"`,
      `"${r.category.categoryCode}"`,
      r.year,
      r.evRegistrations,
      r.totalVehicleRegistrations,
      r.evPenetrationPct.toFixed(2),
      r.yoyGrowthPct !== null ? r.yoyGrowthPct.toFixed(2) : 'N/A',
      `"${r.dataSource}"`,
    ]);

    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  }
}
