/******************************************************************************************
 * Repository: https://github.com/prisma-api/prisma-api
 * Author: Prisma Api Community
 * Email: <prisma.api.community@gmail.com>
 * License: MIT
 * License Text: THE SOFTWARE IS PROVIDED 'AS IS'
 * Copyright: prisma-api (c), All rights reserved
 * Create date: Thu Oct 14 2021 17:46:52 GMT+0700 (Krasnoyarsk Standard Time)
******************************************************************************************/
import { Prisma, PrismaClient, Category } from '@prisma/client';
import type * as Types from '../../types';
import * as utils from '../../utils';

const prisma = new PrismaClient();

/**
 * получение нескольких категорий /api/v1/category/findmany
 * @param {{args: Prisma.CategoryFindManyArgs}}
 * @returns {Category[] | null}
 */
interface Args extends Types.GlobalParams {
  args: Prisma.CategoryFindManyArgs;
  login?: {
    email: string;
    password: string;
  };
}

const middleware: Types.NextHandler<any, Args, any> = async (req, res, next) => {
  const { body } = req;
  const { args, lang } = body;
  const newArgs = args !== undefined ? args : {};
  req.body.args = newArgs;
  next();
};

const handler: Types.RequestHandler<any, Args, Category[]> = async (req, res) => {
  const { body } = req;
  const { args, lang } = body;
  const { where, skip, take } = args;
  let count;
  try {
    count = await prisma.category.count({
      where,
    });
  } catch (e) {
    utils.saveLog(e, req, 'Error get count of categories', { where });
    return res.status(500).json({
      status: utils.ERROR,
      message: lang.SERVER_ERROR,
      stdErrMessage: utils.getStdErrMessage(e),
      data: [],
    });
  }
  let result;
  try {
    result = await prisma.category.findMany(args);
  } catch (err) {
    utils.saveLog(err, req, 'Error get categories', body);
    return res.status(500).json({
      status: utils.ERROR,
      message: lang.SERVER_ERROR,
      data: [],
      stdErrMessage: utils.getStdErrMessage(err),
    });
  }
  if (result.length === 0) {
    return res.status(404).json({
      status: utils.WARNING,
      message: lang.NOT_FOUND,
      data: [],
    });
  }
  return res.status(200).json({
    status: utils.SUCCESS,
    message: lang.DATA_RECEIVED,
    data: result,
    count,
    skip: skip || null,
    take: take || null,
  });
};

export { middleware, handler };
