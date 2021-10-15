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

const prisma = new PrismaClient();

/**
 * Изменить одного пользователя /api/v1/user/update
 * Подтвердить почту /api/v1/user/confirm
 * @param {{args: Prisma.UserUpdateArgs}}
 * @returns {User | null}
 */
interface Args extends Types.GlobalParams {
  args: Prisma.UserUpdateArgs;
  confirm?: {
    email: string;
    key: string;
  };
  changePassword?: {
    key?: string;
    email?: string;
    oldPassword: string;
    password: string;
    passwordRepeat: string;
  };
  changePasswordByKey?: {
    key: string;
    oldPassword: string;
    password: string;
    passwordRepeat: string;
  };
}

const middleware: Types.NextHandler<any, Args, any> = async (req, res, next) => {
  const { body, url, method, query } = req;
  const { e, k } = query;
  const { args, lang, confirm, parsedToken, user, changePassword } = body;
  let _email, _key, _confirm, _changePass;
  const newArgs = Object.assign({}, args);
  // проверяет идет ли подтверждение почты
  if (url.match(/^\/confirm/) && method.toUpperCase() === 'GET') {
    _email = e;
    _key = k;
    _confirm = true;
  } else if (url.match(/^\/api\/v1\/user\/confirm/)) {
    if (confirm === undefined) {
      return res.status(400).json({
        status: utils.WARNING,
        message: lang.BAD_REQUEST,
        stdErrMessage: utils.getStdErrMessage(
          new Error('Missing parameter confirm { email, key }')
        ),
        data: null,
      });
    }
    const { email, key } = confirm;
    _email = email;
    _key = key;
    _confirm = true;
  } else if (
    url.match(/^\/api\/v1\/user\/changepass/) ||
    url.match(/^\/api\/v1\/user\/changepassbykey/)
  ) {
    _changePass = true;
  } else if (url.match(/^\/forgot/)) {
    // если идет смена пароля по ключу то остальные изменения отклоняет
    newArgs.data = {};
    if (!e || !k) {
      return res.status(400).json({
        status: utils.WARNING,
        message: lang.BAD_REQUEST,
        stdErrMessage: utils.getStdErrMessage(new Error(`Missing argument - e: ${e}, k: ${k}`)),
        data: null,
      });
    }
    let _user;
    try {
      _user = await prisma.user.findFirst({
        where: {
          email: e,
        },
      });
    } catch (e) {
      utils.saveLog(e, req, 'Error get user by email while chnage pass by key', { _email, _key });
      return res.status(500).json({
        status: utils.ERROR,
        message: lang.SERVER_ERROR,
        stdErrMessage: utils.getStdErrMessage(e),
        data: null,
      });
    }
    if (_user === null) {
      return res.status(404).json({
        status: utils.WARNING,
        message: lang.USER_NOT_FOUND,
        stdErrMessage: utils.getStdErrMessage(new Error('User not found')),
        data: null,
      });
    }
    if (_user.forgotKey !== k) {
      return res.status(403).json({
        status: utils.WARNING,
        message: lang.FORBIDDEN,
        stdErrMessage: utils.getStdErrMessage(new Error('Forgot key is not accepted')),
        data: null,
      });
    }
    const forgotKey = utils.getHash(32);
    const date = new Date();
    try {
      _user = await prisma.user.update({
        where: {
          id: _user.id,
        },
        data: {
          forgotKey,
          createForgot: date,
          updated_at: date,
        },
      });
    } catch (e) {
      utils.saveLog(e, req, 'Error update user confirm', { user });
      return res.status(500).json({
        status: utils.ERROR,
        message: lang.SERVER_ERROR,
        stdErrMessage: utils.getStdErrMessage(e),
        data: null,
      });
    }
    return res.status(201).json({
      status: utils.SUCCESS,
      message: lang.FORGOT_RECEIVED,
      data: _user,
    });
  }
  // Если идет подтверждение почты
  if (_confirm) {
    // если подтверждение почты то остальные изменения отклоняет
    newArgs.data = {};
    if (!_email || !_key) {
      return res.status(400).json({
        status: utils.WARNING,
        message: lang.BAD_REQUEST,
        stdErrMessage: utils.getStdErrMessage(
          new Error(`Missing argument - e: ${_email}, k: ${_key}`)
        ),
        data: null,
      });
    }
    let _user;
    try {
      _user = await prisma.user.findFirst({
        where: {
          email: _email,
        },
      });
    } catch (e) {
      utils.saveLog(e, req, 'Error get user by email while confirm', { _email, _key });
      return res.status(500).json({
        status: utils.ERROR,
        message: lang.SERVER_ERROR,
        stdErrMessage: utils.getStdErrMessage(e),
        data: null,
      });
    }
    if (_user === null) {
      return res.status(404).json({
        status: utils.WARNING,
        message: lang.USER_NOT_FOUND,
        stdErrMessage: utils.getStdErrMessage(new Error('User not found')),
        data: null,
      });
    }
    if (_user.confirmed) {
      return res.status(200).json({
        status: utils.SUCCESS,
        message: lang.EMAIL_CONFIRMED,
        stdErrMessage: utils.getStdErrMessage(new Error('Email was confirmed earlier')),
        data: _user,
      });
    }
    if (_user.confirmKey !== _key) {
      return res.status(403).json({
        status: utils.WARNING,
        message: lang.FORBIDDEN,
        stdErrMessage: utils.getStdErrMessage(new Error('Confirm key is not accepted')),
        data: null,
      });
    }
    try {
      _user = await prisma.user.update({
        where: {
          id: _user.id,
        },
        data: {
          confirmed: true,
          updated_at: new Date(),
        },
      });
    } catch (e) {
      utils.saveLog(e, req, 'Error update user confirm', { user });
      return res.status(500).json({
        status: utils.ERROR,
        message: lang.SERVER_ERROR,
        stdErrMessage: utils.getStdErrMessage(e),
        data: null,
      });
    }
    return res.status(201).json({
      status: utils.SUCCESS,
      message: lang.EMAIL_CONFIRMED,
      data: user,
    });
  }
  // Если идет смена пароля пользователем
  if (_changePass) {
    newArgs.data = {};
    if (changePassword === undefined) {
      return res.status(400).json({
        status: utils.WARNING,
        message: lang.BAD_REQUEST,
        stdErrMessage: utils.getStdErrMessage(
          new Error('Missing parameter changePassword { oldPassword, password, passwordRepeat }')
        ),
        data: null,
      });
    }
    const { oldPassword, password, passwordRepeat, key, email } = changePassword;
    let _user;
    if (!parsedToken || !user) {
      if (!key || !email) {
        return res.status(400).json({
          status: utils.WARNING,
          message: lang.BAD_REQUEST,
          stdErrMessage: utils.getStdErrMessage(
            new Error('Missing key or email in changePassword object')
          ),
          data: null,
        });
      }
      try {
        _user = await prisma.user.findFirst({
          where: {
            email,
          },
        });
      } catch (e) {
        utils.saveLog(e, req, 'Error get user by email while chnage password by key', {
          changePassword,
        });
        return res.status(500).json({
          status: utils.ERROR,
          message: lang.BAD_REQUEST,
          stdErrMessage: utils.getStdErrMessage(e),
          code: utils.CODES.data,
          data: null,
        });
      }
      // пользователь не найден
      if (_user === null) {
        return res.status(204).json({
          status: utils.WARNING,
          message: lang.BAD_REQUEST,
          stdErrMessage: utils.getStdErrMessage(
            new Error('User not found in change password by key')
          ),
          data: null,
        });
      }
      // Не соответстует ключ или отсутствует дата создания ключа
      const createForgot = _user.createForgot?.getTime();
      if (key !== _user.forgotKey || !createForgot) {
        return res.status(203).json({
          status: utils.WARNING,
          message: lang.BAD_REQUEST,
          stdErrMessage: utils.getStdErrMessage(new Error('Forgot key not allowed')),
          data: null,
        });
      }
      // Не истекла ли дата жизни ключа
      const dateNow = Date.now();
      const time = (dateNow - createForgot) / 1000 / 3600 / 24;
      if (time >= utils.FORGOT_PASSWORD_KEY_LIVE_DAYS) {
        return res.status(203).json({
          status: utils.WARNING,
          message: lang.LINK_EXPIRED,
          stdErrMessage: utils.getStdErrMessage(
            new Error(
              `utils.FORGOT_PASSWORD_KEY_LIVE_DAYS : ${utils.FORGOT_PASSWORD_KEY_LIVE_DAYS}`
            )
          ),
          data: e,
        });
      }
    } else {
      _user = user;
    }
    if (!oldPassword) {
      return res.status(400).json({
        status: utils.WARNING,
        message: lang.OLD_PASSWORD_IS_REQUIRED,
        code: utils.CODES.password,
        stdErrMessage: utils.getStdErrMessage(new Error(`Received oldPassword is ${oldPassword}`)),
        data: null,
      });
    }
    const checkPass = await utils.comparePasswords(oldPassword, _user.password, req);
    if (checkPass.data === null) {
      return res.status(500).json({
        status: utils.ERROR,
        message: lang.SERVER_ERROR,
        stdErrMessage: checkPass.stdErrMessage,
        data: null,
      });
    }
    if (checkPass.data === false) {
      return res.status(403).json({
        status: utils.WARNING,
        message: lang.FORBIDDEN,
        stdErrMessage: utils.getStdErrMessage(new Error('Old password is wrong')),
        data: null,
      });
    }
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
    const passHash = await utils.createPasswordHash(password, req);
    if (passHash.data === null) {
      return res.status(500).json({
        status: utils.ERROR,
        message: lang.SERVER_ERROR,
        stdErrMessage: passHash.stdErrMessage,
        data: null,
      });
    }
    let updatedUser;
    // Создает новый ключ
    const forgotKey = utils.getHash(32);
    const date = new Date();
    try {
      updatedUser = await prisma.user.update({
        where: {
          id: _user.id,
        },
        data: {
          password: passHash.data,
          forgotKey,
          createForgot: date,
          updated_at: date,
        },
      });
    } catch (e) {
      utils.saveLog(e, req, 'Error update user password', { passHash });
      return res.status(500).json({
        status: utils.ERROR,
        message: lang.SERVER_ERROR,
        stdErrMessage: utils.getStdErrMessage(e),
        data: null,
      });
    }
    const token = utils.createToken(
      {
        id: _user.id,
        password: passHash.data,
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
    return res.status(201).json({
      status: utils.SUCCESS,
      message: lang.PASSWORD_CHANGED,
      data: updatedUser,
      token,
    });
  }
  newArgs.data = newArgs.data || {};
  newArgs.data.updated_at = new Date();
  req.body.args = newArgs;
  next();
};

const handler: Types.RequestHandler<any, Args, User | null> = async (req, res) => {
  const { body } = req;
  const { args, lang } = body;
  let result;
  try {
    result = await prisma.user.update(args);
  } catch (err) {
    utils.saveLog(err, req, 'Error update user', { body: body.args });
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
    message: lang.DATA_UPDATED,
    data: result,
  });
};

export { middleware, handler };
