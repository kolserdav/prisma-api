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

const server = express();

server.use(cors({ origin: '*' }));

// Отлавливаем неожиданные исключения
process.on('uncaughtException', (err: Error, origin: any) => {
  utils.saveLog(err, utils.getEmptyRequest('uE'), 'uncaughtException', { origin });
});
process.on('unhandledRejection', (reason: Error, promise) => {
  utils.saveLog(reason, utils.getEmptyRequest('uR'), 'unhandledRejection', {});
});

server.use(express.json({ limit: '5mb' }));
// Глобальный языковой посредник
server.use(middleware.getLang);

export default {
  server: (args: any) => {
    console.log('core', args);
    return server;
  },
  process,
};
