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
  const schoolId = req.query['school_id'] as string | undefined;
  const users = await userService.listUsers(req.user!, schoolId);
  sendSuccess(res, users);
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
