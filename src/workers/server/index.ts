/******************************************************************************************
 * Repository: https://github.com/prisma-api/prisma-api
 * Author: Prisma Api Community
 * Email: <prisma.api.community@gmail.com>
 * License: MIT
 * License Text: THE SOFTWARE IS PROVIDED 'AS IS'
 * Copyright: prisma-api (c), All rights reserved
 * Create date: Sat Oct 16 2021 00:29:34 GMT+0700 (Krasnoyarsk Standard Time)
 ******************************************************************************************/
/**
 * Этот файл является обработчиком
 * создания сервера для пользователя
 * обрабатывает параметры и получив данные от ядра
 * и, при помощи воркеров, пишет файлы для пользовательского
 * сервера, затем запускает прослушиватель подключив эти файлы
 * ассинхронно
 */
import type { PrismaApiTypes } from '../../../index';
import coreServer from '../../core/index';

export default function workerServer(args: PrismaApiTypes.PrismaApiArgs) {
  const server = Object.assign({}, coreServer);
  console.log(args);
  return server;
}
