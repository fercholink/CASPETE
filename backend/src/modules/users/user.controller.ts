import type { Request, Response } from 'express';
import * as userService from './user.service.js';
import { createUserSchema, updateUserSchema } from './user.schemas.js';
import { sendSuccess } from '../../utils/apiResponse.js';

export async function create(req: Request, res: Response) {
  const input = createUserSchema.parse(req.body);
  const user = await userService.createUser(input, req.user!);
  sendSuccess(res, user, 'Usuario creado exitosamente', 201);
}

export async function list(req: Request, res: Response) {
  const page = Number(req.query['page']) || 1;
  const limit = Number(req.query['limit']) || 50;
  const opts: { page: number; limit: number; search?: string; role?: string; active?: string; school_id?: string } = { page, limit };
  if (typeof req.query['search'] === 'string') opts.search = req.query['search'];
  if (typeof req.query['role'] === 'string') opts.role = req.query['role'];
  if (typeof req.query['active'] === 'string') opts.active = req.query['active'];
  if (typeof req.query['school_id'] === 'string') opts.school_id = req.query['school_id'];
  const result = await userService.listUsers(req.user!, opts);
  sendSuccess(res, result);
}

export async function getOne(req: Request, res: Response) {
  const id = req.params['id'] as string;
  const user = await userService.getUser(id, req.user!);
  sendSuccess(res, user);
}

export async function update(req: Request, res: Response) {
  const id = req.params['id'] as string;
  const input = updateUserSchema.parse(req.body);
  const user = await userService.updateUser(id, input, req.user!);
  sendSuccess(res, user, 'Usuario actualizado');
}

export async function deactivate(req: Request, res: Response) {
  const id = req.params['id'] as string;
  const user = await userService.deactivateUser(id, req.user!);
  sendSuccess(res, user, 'Usuario desactivado');
}

export async function deleteOne(req: Request, res: Response) {
  const id = req.params['id'] as string;
  await userService.deleteUser(id, req.user!);
  sendSuccess(res, null, 'Usuario eliminado permanentemente');
}
