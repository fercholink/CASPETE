import type { Request, Response } from 'express';
import * as orderService from './order.service.js';
import { createOrderSchema, deliverOrderSchema, topupSchema } from './order.schemas.js';
import { sendSuccess } from '../../utils/apiResponse.js';

export async function create(req: Request, res: Response) {
  const input = createOrderSchema.parse(req.body);
  const order = await orderService.createOrder(input, req.user!);
  sendSuccess(res, order, 'Pedido creado', 201);
}

export async function list(req: Request, res: Response) {
  const status        = req.query['status']         as string | undefined;
  const scheduledDate = req.query['scheduled_date'] as string | undefined;
  const search        = req.query['search']         as string | undefined;
  const page          = Number(req.query['page'])   || 1;
  const limit         = Number(req.query['limit'])  || 20;
  const orders = await orderService.listOrders(req.user!, {
    ...(status        && { status }),
    ...(scheduledDate && { scheduled_date: scheduledDate }),
    ...(search        && { search }),
    page,
    limit,
  });
  sendSuccess(res, orders);
}

export async function getOne(req: Request, res: Response) {
  const id = req.params['id'] as string;
  const order = await orderService.getOrder(id, req.user!);
  sendSuccess(res, order);
}

export async function confirm(req: Request, res: Response) {
  const id = req.params['id'] as string;
  const order = await orderService.confirmOrder(id, req.user!);
  sendSuccess(res, order, 'Pedido confirmado');
}

export async function cancel(req: Request, res: Response) {
  const id = req.params['id'] as string;
  const order = await orderService.cancelOrder(id, req.user!);
  sendSuccess(res, order, 'Pedido cancelado y saldo reembolsado');
}

export async function deliver(req: Request, res: Response) {
  const id = req.params['id'] as string;
  const { otp_code } = deliverOrderSchema.parse(req.body);
  const order = await orderService.deliverOrder(id, otp_code, req.user!);
  sendSuccess(res, order, '¡Entrega verificada!');
}

export async function deliverStudent(req: Request, res: Response) {
  const { student_id, delivery_code } = req.body;
  const result = await orderService.deliverStudentOrders(student_id, delivery_code, req.user!);
  sendSuccess(res, result, `¡${result.delivered} pedido(s) entregado(s)!`);
}

export async function bulkConfirm(req: Request, res: Response) {
  const scheduledDate = req.query['scheduled_date'] as string | undefined;
  const result = await orderService.bulkConfirmOrders(req.user!, scheduledDate);
  sendSuccess(res, result, `${result.confirmed} pedido(s) confirmado(s)`);
}

export async function topup(req: Request, res: Response) {
  const studentId = req.params['studentId'] as string;
  const input = topupSchema.parse(req.body);
  const student = await orderService.topupStudent(studentId, input, req.user!);
  sendSuccess(res, student, 'Saldo recargado');
}

export async function getStats(req: Request, res: Response) {
  const stats = await orderService.getOrderStats(req.user!);
  sendSuccess(res, stats);
}

export async function deleteOne(req: Request, res: Response) {
  const id = req.params['id'] as string;
  await orderService.deleteOrder(id, req.user!);
  sendSuccess(res, null, 'Pedido eliminado permanentemente');
}
