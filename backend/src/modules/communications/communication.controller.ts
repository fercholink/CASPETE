import type { Request, Response } from 'express';
import * as communicationService from './communication.service.js';
import { createCommunicationSchema } from './communication.schemas.js';
import { sendSuccess } from '../../utils/apiResponse.js';

export async function create(req: Request, res: Response) {
  const input = createCommunicationSchema.parse(req.body);
  const comm = await communicationService.createCommunication(input, req.user!);
  sendSuccess(res, comm, 'Mensaje enviado con éxito', 201);
}

export async function list(req: Request, res: Response) {
  const page = Math.max(1, Number(req.query['page']) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query['limit']) || 50));
  const box = req.query['box'] === 'outbox' ? 'outbox' : 'inbox';

  const result = await communicationService.listCommunications(req.user!, { box, page, limit });
  sendSuccess(res, result);
}

export async function getOne(req: Request, res: Response) {
  const id = req.params['id'] as string;
  const comm = await communicationService.getCommunication(id, req.user!);
  sendSuccess(res, comm);
}

export async function deleteOne(req: Request, res: Response) {
  const id = req.params['id'] as string;
  await communicationService.deleteCommunication(id, req.user!);
  sendSuccess(res, null, 'Mensaje eliminado con éxito');
}
