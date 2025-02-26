import { Request, Response } from 'express';
import ActivityLog from '../models/activityLog';

export const getLogs = async (_req: Request, res: Response): Promise<void> => {
  try {
    const logs = await ActivityLog.findAll({
      order: [['createdAt', 'DESC']],
      limit: 50
    });

    res.status(200).json(logs);
  } catch (error) {
    res.status(500).json({
      message: 'Error al obtener logs',
      error: (error as Error).message
    });
  }
}; 