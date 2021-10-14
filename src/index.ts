/******************************************************************************************
 * Repository: https://github.com/prisma-api/prisma-api
 * Author: Prisma Api Community
 * Email: <prisma.api.community@gmail.com>
 * License: MIT
 * License Text: THE SOFTWARE IS PROVIDED 'AS IS'
 * Copyright: prisma-api (c), All rights reserved
 * Create date: Thu Oct 14 2021 17:46:52 GMT+0700 (Krasnoyarsk Standard Time)
******************************************************************************************/
/**
 * Индекный файл сервера
 */
import express from 'express';
import cors from 'cors';
import * as api from './api';
import * as middleware from './middleware';
import * as utils from './utils';

const app = express();

app.use(cors({ origin: '*' }));

// Отлавливаем неожиданные исключения
process.on('uncaughtException', (err: Error, origin: any) => {
  utils.saveLog(err, utils.getEmptyRequest('uE'), 'uncaughtException', { origin });
});
process.on('unhandledRejection', (reason: Error, promise) => {
  utils.saveLog(reason, utils.getEmptyRequest('uR'), 'unhandledRejection', {});
});

app.use(express.json({ limit: '5mb' }));
// Глобальный языковой посредник
app.use(middleware.getLang);

////// апи запросы с посредниками
//// API пользователя
// получить одного пользователя
app.post('/api/v1/user/findfirst', api.user.findFirst.middleware, api.user.findFirst.handler);
// войти по почте и паролю
app.post('/api/v1/user/login', api.user.findFirst.middleware, api.user.findFirst.handler);
// регистрация
app.post('/api/v1/user/create', api.user.create.middleware, api.user.create.handler);
// изменение пользователя
app.post(
  '/api/v1/user/update',
  middleware.auth<'User'>({
    selfUsage: {
      field: 'id',
      model: 'User',
      andAdmin: true,
      closedSelf: ['role'],
      closedAdmin: [],
    },
  }),
  api.user.update.middleware,
  api.user.update.handler
);
// подтверждение почты по ключу
app.post('/api/v1/user/confirm', api.user.update.middleware, api.user.update.handler);
// смена пароля авторизщованным пользователем
app.post(
  '/api/v1/user/changepass',
  middleware.auth<'User'>({
    selfUsage: {
      field: 'id',
      model: 'User',
      andAdmin: false,
    },
  }),
  api.user.update.middleware,
  api.user.update.handler
);
// запрос письма на подтверждение почты
app.post(
  '/api/v1/user/sendconfirm',
  middleware.auth<'User'>({
    selfUsage: {
      field: 'id',
      model: 'User',
      andAdmin: false,
    },
  }),
  api.user.findFirst.middleware,
  api.user.findFirst.handler
);
// запрос письма на смену пароля
app.post(
  '/api/v1/user/sendforgot',
  middleware.auth<'User'>({
    selfUsage: {
      field: 'id',
      model: 'User',
      andAdmin: false,
    },
  }),
  api.user.findFirst.middleware,
  api.user.findFirst.handler
);
// удаление пользователя
app.post(
  '/api/v1/user/delete',
  middleware.auth<'User'>({
    selfUsage: {
      field: 'id',
      model: 'User',
      andAdmin: true,
    },
  }),
  api.user.delete.middleware,
  api.user.delete.handler
);
// изменение пароля по ключу
app.post('/api/v1/user/changepassbykey', api.user.update.middleware, api.user.update.handler);
// получение пользователей
app.post(
  '/api/v1/user/findmany',
  middleware.auth({
    onlyAdmin: true,
  }),
  api.user.findMany.middleware,
  api.user.findMany.handler
);

//// API категорий
// создать категорию
app.post(
  '/api/v1/category/create',
  middleware.auth({
    onlyAdmin: true,
  }),
  api.category.create.middleware,
  api.category.create.handler
);
// изменить категорию
app.post(
  '/api/v1/category/update',
  middleware.auth({
    onlyAdmin: true,
  }),
  api.category.update.middleware,
  api.category.update.handler
);
// получить одну категорию
app.post(
  '/api/v1/category/findfirst',
  api.category.findFirst.middleware,
  api.category.findFirst.handler
);
// получить несколько категорий
app.post(
  '/api/v1/category/findmany',
  api.category.findMany.middleware,
  api.category.findMany.handler
);
// удалить одну категорию
app.post(
  '/api/v1/category/delete',
  middleware.auth({
    onlyAdmin: true,
  }),
  api.category.delete.middleware,
  api.category.delete.handler
);

//// Временные апи пока нет страниц
// страница при переходе по ссылке подтверждения почты
app.get('/confirm', api.user.update.middleware, api.user.update.handler);
// страницы при переходе по ссылке получения ключа для смены пароля
app.get('/forgot', api.user.update.middleware, api.user.update.handler);

const port = 3333;
app.listen(port, () => {
  utils.saveLog({}, utils.getEmptyRequest('/start'), `Listen on port ${port}`, {});
});
