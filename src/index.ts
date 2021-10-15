/**
 * Этот файл экспортирует пространство имет prismaApi
 * которое будет подключать пользователь в индексном файле
 * своего сервера
 */
import server from './workers/server';

export default {
  server,
};
