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
 * создание одной категории /api/v1/category/create  .
 * @param {{args: Prisma.CategoryCreateArgs}}
 * @returns {Category | null}
 */
interface Args extends Types.GlobalParams {
  args: Prisma.CategoryCreateArgs;
  login?: {
    email: string;
    password: string;
  };
}
const middleware: Types.NextHandler<any, Args, any> = async (req, res, next) => {
  const { body } = req;
  const { args, lang } = body;
  const _args = args || {};
  const { data } = _args;
  const _data = data || {};
  const { title } = _data;
  let oldCategory;
  ``;
  try {
    oldCategory = await prisma.category.findFirst({
      where: {
        title,
      },
      select: {
        id: true,
        title: true,
      },
    });
  } catch (e) {
    utils.saveLog(e, req, 'Error get old category', { title });
    return res.status(500).json({
      status: utils.ERROR,
      message: lang.SERVER_ERROR,
      stdErrMessage: utils.getStdErrMessage(e),
      data: null,
    });
  }
  if (oldCategory !== null) {
    return res.status(400).json({
      status: utils.WARNING,
      message: lang.CATEGORY_TITLE_EXISTS,
      stdErrMessage: utils.getStdErrMessage(new Error(`${JSON.stringify(oldCategory)}`)),
      data: null,
    });
  }
  next();
};

const handler: Types.RequestHandler<any, Args, Category | null> = async (req, res) => {
  const { body } = req;
  const { args, lang } = body;
  let result;
  try {
    result = await prisma.category.create(args);
  } catch (err) {
    utils.saveLog(err, req, 'Error create category', body);
    return res.status(500).json({
      status: utils.ERROR,
      message: lang.SERVER_ERROR,
      data: null,
      stdErrMessage: utils.getStdErrMessage(err),
    });
  }
  if (result === null) {
    return res.status(404).json({
      status: utils.WARNING,
      message: lang.NOT_FOUND,
      data: null,
    });
  }
  return res.status(201).json({
    status: utils.SUCCESS,
    message: lang.DATA_SAVED,
    data: result,
  });
};

export { middleware, handler };
