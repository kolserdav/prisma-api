/******************************************************************************************
 * Repository: https://github.com/prisma-api/prisma-api
 * Author: Prisma Api Community
 * Email: <prisma.api.community@gmail.com>
 * License: MIT
 * License Text: THE SOFTWARE IS PROVIDED 'AS IS'
 * Copyright: prisma-api (c), All rights reserved
 * Create date: Fri Oct 15 2021 23:58:11 GMT+0700 (Krasnoyarsk Standard Time)
 ******************************************************************************************/
/**
 * Этот файл экспортирует пространство имет prismaApi
 * которое будет подключать пользователь в индексном файле
 * своего сервера
 */
import dotenv from 'dotenv';
dotenv.config();
import type { PrismaApiTypes } from '../index';
import server from './workers/server';

export default function prismaApi(args: PrismaApiTypes.PrismaApiArgs) {
  return server(args);
}

const app = server({ maxBodySize: '10mb' });
app.get('/', (req, res) => {
  console.log(1);
  return res.status(200).json({ s: '1' });
});
app.listen(3000, () => {
  console.log('listen', 3000);
});
