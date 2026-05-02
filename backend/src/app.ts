import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import { errorHandler } from './middleware/error.middleware.js';
import authRouter from './modules/auth/auth.router.js';
import schoolRouter from './modules/schools/school.router.js';
import studentRouter from './modules/students/student.router.js';
import productRouter from './modules/products/product.router.js';
import storeRouter from './modules/stores/store.router.js';
import orderRouter from './modules/orders/order.router.js';
import transactionRouter from './modules/transactions/transaction.router.js';
import userRouter from './modules/users/user.router.js';
import reportRouter from './modules/reports/report.router.js';

const app = express();

app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRouter);
app.use('/api/schools', schoolRouter);
app.use('/api/students', studentRouter);
app.use('/api/products', productRouter);
app.use('/api/stores', storeRouter);
app.use('/api/orders', orderRouter);
app.use('/api/transactions', transactionRouter);
app.use('/api/users', userRouter);
app.use('/api/reports', reportRouter);

app.use(errorHandler);

export default app;
