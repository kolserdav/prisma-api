/******************************************************************************************
 * Repository: https://github.com/prisma-api/prisma-api
 * Author: Prisma Api Community
 * Email: <prisma.api.community@gmail.com>
 * License: MIT
 * License Text: THE SOFTWARE IS PROVIDED 'AS IS'
 * Copyright: prisma-api (c), All rights reserved
 * Create date: Thu Oct 14 2021 17:46:52 GMT+0700 (Krasnoyarsk Standard Time)
******************************************************************************************/
/* eslint-disable no-unused-vars */
import type * as E from 'express';
import { User } from '@prisma/client';
import type { Locale } from './locales/types';
namespace Api {
  export type Status = 'error' | 'warning' | 'success';

  export interface Result<T> {
    status: Status;
    message: string;
    data: null | T;
    stdErrMessage?: string;
    code?: string;
    token?: string;
    skip?: number | null;
    take?: number | null;
    count?: number | null;
  }
}

export { Api, E, Locale };

interface ParamsDictionary {
  [key: string]: string;
}

export interface GlobalParams {
  lang: Locale;
  args: any;
  parsedToken: JWT | undefined;
  user: User | undefined;
}

export interface RequestHandler<Query, Body, Response> {
  (
    req: E.Request<ParamsDictionary, Api.Result<Response | null>, Body, Query>,
    res: E.Response<Api.Result<Response | null>>
  ): Promise<E.Response<Api.Result<Response | null>, Record<string, Response>>>;
}

export interface NextHandler<Query, Body, Response> {
  (
    req: E.Request<ParamsDictionary, Api.Result<null>, Body, Query>,
    res: E.Response<Api.Result<any>>,
    next: E.NextFunction
  ): Promise<E.Response<Api.Result<any>, Record<string, any>> | void>;
}

export interface JWT {
  id: number;
  password: string;
}
