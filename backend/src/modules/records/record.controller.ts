import { Request, Response } from 'express';
import { success } from '../../utils/response';
import { recordService } from './record.service';

/**
 * Record controller — request parsing and response only. No business logic.
 */
export const recordController = {
  createRecord: async (req: Request, res: Response): Promise<void> => {
    const record = await recordService.createRecord({
      ...req.body,
      createdBy: req.user!.id,
    });
    success(res, { record }, 201);
  },

  listRecords: async (req: Request, res: Response): Promise<void> => {
    const result = await recordService.listRecords(req.query as never);
    success(res, result);
  },

  getRecordById: async (req: Request, res: Response): Promise<void> => {
    const record = await recordService.getRecordById(req.params.id);
    success(res, { record });
  },

  updateRecord: async (req: Request, res: Response): Promise<void> => {
    const record = await recordService.updateRecord(req.params.id, req.body, req.user!.id);
    success(res, { record });
  },

  deleteRecord: async (req: Request, res: Response): Promise<void> => {
    const record = await recordService.deleteRecord(req.params.id, req.user!.id);
    success(res, { record });
  },
};
