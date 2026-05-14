import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import { errorHandler } from './middleware/error.middleware.js';
import passport from './lib/passport.js';
import authRouter from './modules/auth/auth.router.js';
import schoolRouter from './modules/schools/school.router.js';
import studentRouter from './modules/students/student.router.js';
import productRouter from './modules/products/product.router.js';
import storeRouter from './modules/stores/store.router.js';
import storeProductDirectRouter, { storeProductsSubRouter } from './modules/store-products/store-product.router.js';
import orderRouter from './modules/orders/order.router.js';
import transactionRouter from './modules/transactions/transaction.router.js';
import userRouter from './modules/users/user.router.js';
import reportRouter from './modules/reports/report.router.js';
import topupRequestRouter from './modules/topup-requests/topup-request.router.js';
import categoryRouter from './modules/categories/category.router.js';
import paymentMethodRouter from './modules/payment-methods/payment-method.router.js';
import pushRouter from './modules/push/push.router.js';
import supplierRouter from './modules/suppliers/supplier.router.js';
import complianceRouter from './modules/reports/compliance.router.js';
import allergyRouter from './modules/allergies/allergy.router.js';

const app = express();
 

const allowedOrigins = env.FRONTEND_URL.split(',').map((o) => o.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS: Origin ${origin} not allowed`));
    },
    credentials: true,
  }),
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(passport.initialize());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRouter);
app.use('/api/schools', schoolRouter);
app.use('/api/students', studentRouter);
app.use('/api/products', productRouter);
app.use('/api/stores', storeRouter);
app.use('/api/stores/:storeId/products', storeProductsSubRouter);
app.use('/api/store-products', storeProductDirectRouter);
app.use('/api/orders', orderRouter);
app.use('/api/transactions', transactionRouter);
app.use('/api/users', userRouter);
app.use('/api/reports', reportRouter);
app.use('/api/topup-requests', topupRequestRouter);
app.use('/api/categories', categoryRouter);
app.use('/api/payment-methods', paymentMethodRouter);
app.use('/api/push', pushRouter);
app.use('/api/suppliers', supplierRouter);
app.use('/api/reports', complianceRouter);
app.use('/api/allergies', allergyRouter);

app.use(errorHandler);

export default app;
