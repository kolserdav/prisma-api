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
 * ИНТЕРФЕЙС ПРОГРАММИСТА ФРОНТЕНДА
 * Объявление методов для типизации запросов
 * название метода соответствуют урл запроса /api/v1/user/findfirst=userFindFirst
 * готовые примеры запросов в rest/remote можно запустить в VSCode при помощи расширения humao.rest-client (
 * для активации Ctrl+Shift+P > начать воодить rest > выбрать Rest:SendRequest > настроить
 * там же горячие клавиши
 * )
 */
// Для переноса этого файла себе на фронтенд не забываем генерированный файл типов призмы
import { Prisma as P, User, PrismaPromise } from './prisma';
import Types from '../..';

// ПЕСОЧНИЦА. Внимание! эта функция не вызывается так как у методов нет реализации
// используется только для получения помощи от IDE в подборе запроса по типам
async () => {
  userFindMany({
    where: {
      id: 11,
    },
    skip: 1,
    take: 2,
  });
};

//// Базовые методы пользователя
/**
 * Получить одного пользователя .
 * @param {P.UserFindFirstArgs} args
 */
export async function userFindFirst<T extends P.UserFindFirstArgs>(
  args: P.SelectSubset<T, P.UserFindFirstArgs>
): Promise<
  P.CheckSelect<
    T,
    Types.Api.Result<User | null>,
    PrismaPromise<Types.Api.Result<P.UserGetPayload<T>>>
  >
>;

/**
 * Получить несколько пользователей
 * @param {P.UserFindManyArgs} args
 */
export async function userFindMany<T extends P.UserFindManyArgs>(
  args: P.SelectSubset<T, P.UserFindManyArgs>
): Promise<
  P.CheckSelect<
    T,
    Types.Api.Result<User | null>,
    PrismaPromise<Types.Api.Result<P.UserGetPayload<T>>>
  >
>;

/**
 * Создать одного пользователя
 * @param {P.UserCreateArgs} args
 */
export async function userCreate<T extends P.UserCreateArgs>(
  args: P.SelectSubset<T, P.UserCreateArgs>
): Promise<
  P.CheckSelect<
    T,
    Types.Api.Result<User | null>,
    PrismaPromise<Types.Api.Result<P.UserGetPayload<T>>>
  >
>;

/**
 * Изменить данные одного пользователя
 * @param {P.UserUpdateArgs} args
 */
export async function userUpdate<T extends P.UserUpdateArgs>(
  args: P.SelectSubset<T, P.UserUpdateArgs>
): Promise<
  P.CheckSelect<
    T,
    Types.Api.Result<User | null>,
    PrismaPromise<Types.Api.Result<P.UserGetPayload<T>>>
  >
>;

/**
 * Удалить одного пользователя
 * @param {P.UserDeleteArgs} args
 */
export async function userUpdate<T extends P.UserDeleteArgs>(
  args: P.SelectSubset<T, P.UserDeleteArgs>
): Promise<
  P.CheckSelect<
    T,
    Types.Api.Result<User | null>,
    PrismaPromise<Types.Api.Result<P.UserGetPayload<T>>>
  >
>;

////// Методы категорий ///////
/**
 * Получить одну категорию
 * @param {P.CategoryFindFirstArgs} args
 */
export async function categoryFindFirst<T extends P.CategoryFindFirstArgs>(
  args: P.SelectSubset<T, P.CategoryFindFirstArgs>
): Promise<
  P.CheckSelect<
    T,
    Types.Api.Result<User | null>,
    PrismaPromise<Types.Api.Result<P.UserGetPayload<T>>>
  >
>;

/**
 * Получить несколько категорий
 * @param {P.CategoryFindManyArgs} args
 */
export async function categoryFindMany<T extends P.CategoryFindManyArgs>(
  args: P.SelectSubset<T, P.CategoryFindManyArgs>
): Promise<
  P.CheckSelect<
    T,
    Types.Api.Result<User | null>,
    PrismaPromise<Types.Api.Result<P.UserGetPayload<T>>>
  >
>;

/**
 * Создать одну категорию
 * @param {P.CategoryCreateArgs} args
 */
export async function categoryCreate<T extends P.CategoryCreateArgs>(
  args: P.SelectSubset<T, P.CategoryCreateArgs>
): Promise<
  P.CheckSelect<
    T,
    Types.Api.Result<User | null>,
    PrismaPromise<Types.Api.Result<P.UserGetPayload<T>>>
  >
>;

/**
 * Изменить одну категорию
 * @param {P.CategoryUpdateArgs} args
 */
export async function categoryUpdate<T extends P.CategoryUpdateArgs>(
  args: P.SelectSubset<T, P.CategoryUpdateArgs>
): Promise<
  P.CheckSelect<
    T,
    Types.Api.Result<User | null>,
    PrismaPromise<Types.Api.Result<P.UserGetPayload<T>>>
  >
>;

/**
 * Удалить одну категорию
 * @param {P.CategoryDeleteArgs} args
 */
export async function categoryUpdate<T extends P.CategoryDeleteArgs>(
  args: P.SelectSubset<T, P.CategoryDeleteArgs>
): Promise<
  P.CheckSelect<
    T,
    Types.Api.Result<User | null>,
    PrismaPromise<Types.Api.Result<P.UserGetPayload<T>>>
  >
>;
