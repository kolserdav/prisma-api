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

//// Объявление констант и типов
const prisma = new PrismaClient();
const emailTransport = new utils.Email();

const { APP_URL } = process.env;

/**
 * /api/v1/user/create Регистрация
 * Создать одного пользователя
 * @param {{args: Prisma.UserCreateArgs}}
 * @returns {User | null}
 */
interface Args extends Types.GlobalParams {
  args: Prisma.UserCreateArgs;
  passwordRepeat: string;
}

/**
 * посредник проверяет входные параметры
 * @param req
 * @param res
 * @param next
 * @returns
 */
const middleware: Types.NextHandler<any, Args, any> = async (req, res, next) => {
  const { body } = req;
  const { args, lang, passwordRepeat } = body;
  //// проверка переданных параметров
  if (!args?.data) {
    return res.status(400).json({
      status: utils.WARNING,
      message: lang.BAD_REQUEST,
      stdErrMessage: utils.getStdErrMessage(new Error('Property args.data is missing')),
      code: utils.CODES.data,
      data: null,
    });
  }
  const { password, email } = args.data;
  // проверка почты
  if (!email) {
    return res.status(400).json({
      status: utils.WARNING,
      message: lang.EMAIL_IS_REQUIRED,
      code: utils.CODES.email,
      stdErrMessage: utils.getStdErrMessage(new Error(`Received email is ${email}`)),
      data: null,
    });
  }
  if (!utils.EMAIL_REGEX.test(email)) {
    return res.status(400).json({
      status: utils.WARNING,
      message: lang.EMAIL_IS_INVALID,
      code: utils.CODES.email,
      stdErrMessage: utils.getStdErrMessage(new Error(`Received email is ${email}`)),
      data: null,
    });
  }
  // проверка почты на уникальность
  let oldUser;
  try {
    oldUser = await prisma.user.findUnique({ where: { email } });
  } catch (e) {
    utils.saveLog(e, req, 'Error find user by email', { email });
    return res.status(500).json({
      status: utils.ERROR,
      message: lang.SERVER_ERROR,
      stdErrMessage: utils.getStdErrMessage(e),
      code: utils.CODES.email,
      data: null,
    });
  }
  if (oldUser !== null) {
    return res.status(403).json({
      status: utils.WARNING,
      message: lang.EMAIL_WAS_REGISTERED_EARLIER,
      code: utils.CODES.email,
      data: null,
    });
  }
  // проверка паролей
  if (!password) {
    return res.status(400).json({
      status: utils.WARNING,
      message: lang.PASSWORD_IS_REQUIRED,
      code: utils.CODES.password,
      stdErrMessage: utils.getStdErrMessage(new Error(`Received password is ${password}`)),
      data: null,
    });
  }
  if (!passwordRepeat) {
    return res.status(400).json({
      status: utils.WARNING,
      message: lang.PASSWORD_REPEAT_IS_REQUIRED,
      code: utils.CODES.passwordRepeat,
      stdErrMessage: utils.getStdErrMessage(
        new Error(`Received passwordRepeat is ${passwordRepeat}`)
      ),
      data: null,
    });
  }
  if (password.length < utils.MINIMAL_PASSWORD_LENGTH) {
    return res.status(400).json({
      status: utils.WARNING,
      message: lang.PASSWORD_IS_TOO_SHORT,
      code: utils.CODES.password,
      stdErrMessage: utils.getStdErrMessage(
        new Error(`Received password length is ${password.length}`)
      ),
      data: null,
    });
  }
  if (password !== passwordRepeat) {
    return res.status(400).json({
      status: utils.WARNING,
      message: lang.PASSWORDS_DO_NOT_MATCH,
      code: utils.CODES.passwordRepeat,
      stdErrMessage: utils.getStdErrMessage(
        new Error(`Received password: ${password}, received passordRepeat is ${passwordRepeat}`)
      ),
      data: null,
    });
  }
  // Копия body для перезаписи критических полей
  const newArgs = Object.assign({}, args);
  // при регистрации следим, чтобы пользователь был user
  newArgs.data.role = 'user';
  next();
};

/**
 * Обработчик сохраняет данные, отправляет
 * письмо подтверждения и создает токен
 * @param req
 * @param res
 * @returns
 */
const handler: Types.RequestHandler<any, Args, User | null> = async (req, res) => {
  const { body } = req;
  const { args, lang } = body;
  const { data } = args;
  const { name, email, password } = data;
  // Создание хеша пароля
  const passHash = await utils.createPasswordHash(password, req);
  if (passHash.data === null) {
    return res.status(500).json({
      status: utils.ERROR,
      message: lang.SERVER_ERROR,
      stdErrMessage: passHash.stdErrMessage,
      data: null,
    });
  }
  const newArgs = Object.assign({}, args);
  newArgs.data.password = passHash.data;
  let user;
  try {
    user = await prisma.user.create(newArgs);
  } catch (err) {
    utils.saveLog(err, req, 'Error get user', body);
    return res.status(500).json({
      status: utils.ERROR,
      message: lang.SERVER_ERROR,
      data: null,
      stdErrMessage: utils.getStdErrMessage(err),
    });
  }
  if (user === null) {
    return res.status(404).json({
      status: utils.WARNING,
      message: lang.NOT_FOUND,
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
      status: utils.WARNING,
      message: `${lang.SUCCESS_REGISTRATION} ${lang.EMAIL_CANT_SEND}`,
      stdErrMessage: utils.getStdErrMessage(err),
      data: user,
      token,
    });
  }
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
      status: 'warning',
      message: `${lang.SUCCESS_REGISTRATION} ${lang.EMAIL_CANT_SEND}`,
      stdErrMessage: sendEmailRes.stdErrMessage,
      data: user,
      token,
    });
  }
  return res.status(201).json({
    status: utils.SUCCESS,
    message: lang.SUCCESS_REGISTRATION,
    data: confirmUser || user,
    token,
  });
};

export { middleware, handler };
