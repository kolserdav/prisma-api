/******************************************************************************************
 * Repository: https://github.com/prisma-api/prisma-api
 * Author: Prisma Api Community
 * Email: <prisma.api.community@gmail.com>
 * License: MIT
 * License Text: THE SOFTWARE IS PROVIDED 'AS IS'
 * Copyright: prisma-api (c), All rights reserved
 * Create date: Thu Oct 14 2021 17:46:52 GMT+0700 (Krasnoyarsk Standard Time)
 ******************************************************************************************/
import { User, Prisma, PrismaClient } from '@prisma/client';
import type * as Types from '../../types';
import * as utils from '../../utils';

const emailTransport = new utils.Email();

const { APP_URL } = process.env;

const prisma = new PrismaClient();

/**
 * Получить одного пользователя /api/v1/user/findfirst
 * Залогиниться /api/v1/user/login
 * @param {{args: Prisma.UserFindFirstArgs}}
 * @returns {User | null}
 */
interface Args extends Types.GlobalParams {
  args: Prisma.UserFindFirstArgs;
  login?: {
    email: string;
    password: string;
  };
}

const middleware: Types.NextHandler<any, Args, any> = async (req, res, next) => {
  const { body, url } = req;
  const { args, lang, login, user, parsedToken } = body;
  // если идет аутентификация по логину и паролю
  if (url.match(/\/api\/v1\/user\/login/)) {
    if (login === undefined) {
      return res.status(400).json({
        status: utils.WARNING,
        message: lang.BAD_REQUEST,
        stdErrMessage: utils.getStdErrMessage(
          new Error('Missing parameter login { email, password }')
        ),
        data: null,
      });
    }
    const { email, password } = login;
    if (!email) {
      return res.status(400).json({
        status: utils.WARNING,
        message: lang.EMAIL_IS_REQUIRED,
        stdErrMessage: utils.getStdErrMessage(new Error(`Received email is ${email}`)),
        code: utils.CODES.email,
        data: null,
      });
    }
    if (!password) {
      return res.status(400).json({
        status: utils.WARNING,
        message: lang.PASSWORD_IS_REQUIRED,
        stdErrMessage: utils.getStdErrMessage(new Error(`Received password is ${email}`)),
        code: utils.CODES.password,
        data: null,
      });
    }
    let user;
    try {
      user = await prisma.user.findFirst({
        where: {
          email,
        },
      });
    } catch (e) {
      utils.saveLog(e, req, 'Error get user by email while logining', { email });
      return res.status(500).json({
        status: utils.ERROR,
        message: lang.SERVER_ERROR,
        stdErrMessage: utils.getStdErrMessage(e),
        data: null,
      });
    }
    if (user === null) {
      return res.status(404).json({
        status: utils.WARNING,
        message: lang.USER_NOT_FOUND,
        code: utils.CODES.email,
        data: null,
      });
    }
    const compareRes = await utils.comparePasswords(password, user.password, req);
    if (compareRes.data === null) {
      return res.status(500).json({
        status: utils.ERROR,
        message: lang.SERVER_ERROR,
        stdErrMessage: compareRes.stdErrMessage,
        data: null,
      });
    }
    if (compareRes.data === false) {
      return res.status(403).json({
        status: utils.WARNING,
        message: lang.INVALID_CREDENTIALS,
        stdErrMessage: utils.getStdErrMessage(
          new Error('Received password do not match with saved user password')
        ),
        data: null,
      });
    }
    // Создание токена
    const token = utils.createToken(
      {
        id: user.id,
        password: user.password,
      },
      req
    );
    if (typeof token !== 'string') {
      return res.status(500).json({
        status: utils.ERROR,
        message: lang.SERVER_ERROR,
        stdErrMessage: utils.getStdErrMessage(token),
        data: null,
      });
    }
    return res.status(200).json({
      status: utils.SUCCESS,
      message: lang.SUCCESS_LOGIN,
      data: user,
      token,
    });
  } else if (url.match(/\/api\/v1\/user\/sendconfirm/)) {
    // Если идет запрос повторного письма на подтверждение почты
    if (!parsedToken || !user) {
      utils.saveLog({}, req, 'Not implemented in user.findFirst sendconfirm', {
        parsedToken,
        user,
      });
      return res.status(501).json({
        status: utils.ERROR,
        message: lang.SERVER_ERROR,
        stdErrMessage: utils.getStdErrMessage(
          new Error('This route must be after auth middleware')
        ),
        data: null,
      });
    }
    // Создание ключа для подтверждения почты
    const confirmKey = utils.getHash(32);
    // Записывает ключ подтвержения
    const date = new Date();
    let confirmUser;
    try {
      confirmUser = await prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          confirmKey,
          createConfirm: date,
          updated_at: date,
        },
      });
    } catch (err) {
      utils.saveLog(err, req, 'Error update confirm key for user', { confirmKey, date, user });
      return res.status(502).json({
        status: utils.ERROR,
        message: lang.SERVER_ERROR,
        stdErrMessage: utils.getStdErrMessage(err),
        data: user,
      });
    }
    const { email, name } = confirmUser;
    // Отправляет письмо подтверждения почты
    const sendEmailRes = await emailTransport.sendEmail(req, {
      link: `${APP_URL}/confirm?e=${email}&k=${confirmKey}`,
      lang,
      email,
      type: 'confirm',
      name: name || email,
    });
    if (sendEmailRes.status === utils.ERROR) {
      return res.status(502).json({
        status: utils.ERROR,
        message: lang.SERVER_ERROR,
        stdErrMessage: sendEmailRes.stdErrMessage,
        data: user,
      });
    }
    return res.status(201).json({
      status: utils.SUCCESS,
      message: lang.EMAIL_IS_SEND,
      data: confirmUser,
    });
  } else if (url.match(/\/api\/v1\/user\/sendforgot/)) {
    // Если идет запрос письма на смену пароля
    if (!parsedToken || !user) {
      utils.saveLog({}, req, 'Not implemented in user.findFirst sendforgot', {
        parsedToken,
        user,
      });
      return res.status(501).json({
        status: utils.ERROR,
        message: lang.SERVER_ERROR,
        stdErrMessage: utils.getStdErrMessage(
          new Error('This route must be after auth middleware')
        ),
        data: null,
      });
    }
    // Создание ключа для смены пароля
    const forgotKey = utils.getHash(32);
    // Записывает ключ подтвержения
    const date = new Date();
    let forgotUser;
    try {
      forgotUser = await prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          forgotKey,
          createForgot: date,
          updated_at: date,
        },
      });
    } catch (err) {
      utils.saveLog(err, req, 'Error update forgot key for user', { forgotKey, date, user });
      return res.status(502).json({
        status: utils.ERROR,
        message: lang.SERVER_ERROR,
        stdErrMessage: utils.getStdErrMessage(err),
        data: user,
      });
    }
    const { email, name } = forgotUser;
    // Отправляет письмо с сылкой для смены пароля
    const sendEmailRes = await emailTransport.sendEmail(req, {
      link: `${APP_URL}/forgot?e=${email}&k=${forgotKey}`,
      lang,
      email,
      type: 'forgot',
      name: name || email,
    });
    if (sendEmailRes.status === utils.ERROR) {
      return res.status(502).json({
        status: utils.ERROR,
        message: lang.SERVER_ERROR,
        stdErrMessage: sendEmailRes.stdErrMessage,
        data: user,
      });
    }
    return res.status(201).json({
      status: utils.SUCCESS,
      message: lang.EMAIL_IS_SEND,
      data: forgotUser,
    });
  }
  next();
};

const handler: Types.RequestHandler<any, Args, User | null> = async (req, res) => {
  const { body } = req;
  const { args, lang } = body;
  let result;
  try {
    result = await prisma.user.findFirst(args);
  } catch (err) {
    utils.saveLog(err, req, 'Error get user', body);
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
  return res.status(200).json({
    status: utils.SUCCESS,
    message: lang.DATA_RECEIVED,
    data: result,
  });
};

export { middleware, handler };
