import { Prisma } from '@prisma/client';
import { prisma } from '../../config/db';
import { TxType } from '../../types';

/**
 * Record repository — all Prisma calls for FinancialRecord operations.
 * All list queries enforce isDeleted = false at repository level.
 */
export const recordRepository = {
  create: (data: {
    amount: string;
    type: TxType;
    category: string;
    date: string;
    notes?: string;
    createdBy: string;
  }) => {
    return prisma.financialRecord.create({
      data: {
        amount: new Prisma.Decimal(data.amount),
        type: data.type,
        category: data.category,
        date: new Date(data.date),
        notes: data.notes,
        createdBy: data.createdBy,
      },
    });
  },

  findMany: (filters: {
    type?: TxType;
    category?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
    minAmount?: number;
    maxAmount?: number;
    page: number;
    limit: number;
    sortBy: 'date' | 'amount';
    order: 'asc' | 'desc';
  }) => {
    const {
      type,
      category,
      startDate,
      endDate,
      search,
      minAmount,
      maxAmount,
      page,
      limit,
      sortBy,
      order,
    } = filters;

    const where: Prisma.FinancialRecordWhereInput = {
      isDeleted: false, // ALWAYS enforced at repo level
      ...(type && { type }),
      ...(category && { category: { equals: category, mode: 'insensitive' } }),
      ...(startDate || endDate
        ? {
            date: {
              ...(startDate && { gte: new Date(startDate) }),
              ...(endDate && { lte: new Date(endDate) }),
            },
          }
        : {}),
      ...(search && {
        OR: [
          { notes: { contains: search, mode: 'insensitive' } },
          { category: { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...(minAmount !== undefined || maxAmount !== undefined
        ? {
            amount: {
              ...(minAmount !== undefined && { gte: new Prisma.Decimal(minAmount) }),
              ...(maxAmount !== undefined && { lte: new Prisma.Decimal(maxAmount) }),
            },
          }
        : {}),
    };

    return prisma.financialRecord.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { [sortBy]: order },
    });
  },

  count: (filters: {
    type?: TxType;
    category?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
    minAmount?: number;
    maxAmount?: number;
  }) => {
    const { type, category, startDate, endDate, search, minAmount, maxAmount } = filters;

    const where: Prisma.FinancialRecordWhereInput = {
      isDeleted: false,
      ...(type && { type }),
      ...(category && { category: { equals: category, mode: 'insensitive' } }),
      ...(startDate || endDate
        ? {
            date: {
              ...(startDate && { gte: new Date(startDate) }),
              ...(endDate && { lte: new Date(endDate) }),
            },
          }
        : {}),
      ...(search && {
        OR: [
          { notes: { contains: search, mode: 'insensitive' } },
          { category: { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...(minAmount !== undefined || maxAmount !== undefined
        ? {
            amount: {
              ...(minAmount !== undefined && { gte: new Prisma.Decimal(minAmount) }),
              ...(maxAmount !== undefined && { lte: new Prisma.Decimal(maxAmount) }),
            },
          }
        : {}),
    };

    return prisma.financialRecord.count({ where });
  },

  findById: (id: string) => {
    return prisma.financialRecord.findFirst({
      where: { id, isDeleted: false }, // soft-deleted records excluded
    });
  },

  update: (
    id: string,
    data: {
      amount?: string;
      type?: TxType;
      category?: string;
      date?: string;
      notes?: string | null;
    }
  ) => {
    return prisma.financialRecord.update({
      where: { id },
      data: {
        ...(data.amount !== undefined && { amount: new Prisma.Decimal(data.amount) }),
        ...(data.type !== undefined && { type: data.type }),
        ...(data.category !== undefined && { category: data.category }),
        ...(data.date !== undefined && { date: new Date(data.date) }),
        ...(data.notes !== undefined && { notes: data.notes }),
      },
    });
  },

  /**
   * Soft delete — sets isDeleted = true, never removes the row.
   */
  softDelete: (id: string) => {
    return prisma.financialRecord.update({
      where: { id },
      data: { isDeleted: true },
    });
  },
};
