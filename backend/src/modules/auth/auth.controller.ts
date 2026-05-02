import type { Request, Response } from 'express';
import * as authService from './auth.service.js';
import { registerSchema, loginSchema, updateProfileSchema, changePasswordSchema, refreshTokenSchema } from './auth.schemas.js';
import { sendSuccess } from '../../utils/apiResponse.js';

export async function register(req: Request, res: Response) {
  const input = registerSchema.parse(req.body);
  const result = await authService.registerUser(input);
  sendSuccess(res, result, 'Usuario registrado exitosamente', 201);
}

export async function login(req: Request, res: Response) {
  const input = loginSchema.parse(req.body);
  const result = await authService.loginUser(input);
  sendSuccess(res, result, 'Inicio de sesión exitoso');
}

export async function refresh(req: Request, res: Response) {
  const { refresh_token } = refreshTokenSchema.parse(req.body);
  const result = await authService.refreshTokens(refresh_token);
  sendSuccess(res, result, 'Token renovado');
}

export async function logout(req: Request, res: Response) {
  const { refresh_token } = refreshTokenSchema.parse(req.body);
  await authService.logout(refresh_token);
  sendSuccess(res, null, 'Sesión cerrada');
}

export async function me(req: Request, res: Response) {
  const userId = req.user!.sub;
  const user = await authService.getMe(userId);
  sendSuccess(res, user);
}

export async function updateProfile(req: Request, res: Response) {
  const input = updateProfileSchema.parse(req.body);
  const user = await authService.updateProfile(req.user!.sub, input);
  sendSuccess(res, user, 'Perfil actualizado');
}

export async function changePassword(req: Request, res: Response) {
  const input = changePasswordSchema.parse(req.body);
  await authService.changePassword(req.user!.sub, input);
  sendSuccess(res, null, 'Contraseña actualizada');
}
