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
 * Вспомогательные функции
 */
import type * as express from 'express';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import * as nodemailer from 'nodemailer';
import * as Mail from 'nodemailer/lib/mailer';
// Переводит html в текст для приложений клиентов, которые не могут читать html
import { htmlToText } from 'html-to-text';
import type * as Types from '../types';

export const SUCCESS = 'success';
export const ERROR = 'error';
export const WARNING = 'warning';

const { NODE_ENV, JSONWEBTOKEN_KEY }: any = process.env;
const DEV = NODE_ENV === 'development';

export const MINIMAL_PASSWORD_LENGTH = 6;
export const FORGOT_PASSWORD_KEY_LIVE_DAYS = 3;
export const PASSWORD_SALT_ROUNDS = 10;

export const CODES = {
  data: 'data',
  email: 'email',
  password: 'password',
  passwordRepeat: 'password-repeat',
};

export const EMAIL_REGEX =
  /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

export function getStdErrMessage(err: Error | any) {
  return DEV ? err.message : 'Standart error disabled in production';
}

/**
 * Получение случайного хеша
 * @param count [number] количество символов
 */
export function getHash(count: number): string {
  const allSymbols = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i <= count; i++) {
    const rand = parseInt((Math.random() * (allSymbols.length - 1)).toFixed(0), 10);
    result += allSymbols[rand];
  }
  return result;
}

/**
 * Единая функция для записи ошибок в лог
 * @param err // Объект ошибки если требуется иначе передаем null
 * @param req // Объект запроса express
 * @param message // Сообщение
 * @param body // Дополнительные данные для лога
 */
export function saveLog(
  err: Error | null | any,
  req: express.Request,
  message: string,
  body: any
): void {
  if (err) {
    console.error(new Date(), message, err, {
      url: req.url,
      headers: req.headers,
      body,
    });
  } else {
    console.warn(new Date(), message, body);
  }
}

/**
 * Единая функция для вывода отладочных сообщений
 * @param err // Объект ошибки если требуется иначе передаем null
 * @param message // Сообщение
 * @param body // Дополнительные данные для лога
 */
export function debugLog(err: Error | null | any, message: string, context?: any): void {
  if (err) {
    console.error(new Date(), err, '\n', message, {
      context: context ? context : null,
    });
  } else {
    console.warn(new Date(), '\n', message, context);
  }
}

/**
 * Создание хеша из строки
 * @param string  исходная строка
 * @param saltRounds количесто оборотов соли
 * @param req контекст запроса
 * @param errMess сообщение об ошибке для лога
 */
export async function createHash(
  string: string,
  saltRounds: number,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  req: Types.E.Request,
  errMess: string
): Promise<string | Error> {
  return await new Promise((resolve) => {
    // Создает соль для хеша пароля, вторым параметром колбек для создания самого хеша
    bcrypt.genSalt(saltRounds, (err, salt) => {
      if (err) {
        saveLog(err, req, errMess + ' SALT', { string });
        resolve(err);
      }
      // Создает хеш пароля
      bcrypt.hash(string, salt, (err, hash) => {
        if (err) {
          saveLog(err, req, errMess + ' HASH', { string, saltRounds });
          resolve(err);
        }
        resolve(hash);
      });
    });
  });
}

/**
 * Сверка  строки с хешем
 * @param string [string] сверяемая строка
 * @param hash [string] хеш с которым ведется сверка
 * @param req [Express.Request] контекст запроса для лога
 * @param errMess [string] сообщение об ошибке для лога
 */
async function compareHash(
  string: string,
  hash: string,
  req: Types.E.Request,
  errMess: string
): Promise<boolean | Error> {
  return await new Promise((resolve) => {
    bcrypt.compare(string, hash, (err, result) => {
      if (err) {
        saveLog(err, req, errMess, { string, hash });
        resolve(err);
      }
      resolve(result);
    });
  });
}

/**
 * Создает токен авторизации
 * @param parsedToken [T.JWT]
 * @param req [Express.Request]
 */
export function createToken(
  parsedToken: Types.JWT,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  req: Types.E.Request
): string | Error | any {
  const errMess = 'Error create token';
  let token: string | Error;
  try {
    token = jwt.sign(parsedToken, JSONWEBTOKEN_KEY);
  } catch (e) {
    saveLog(e, req, errMess, { parsedToken });
    return e;
  }
  return token;
}

/**
 * парсинг токена авторизации
 * @param token
 * @param req
 */
export function parseToken(token: string, req: Types.E.Request): Types.JWT | null {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let data: any = null;
  try {
    data = jwt.verify(token.replace(/Bearer\s*/, ''), JSONWEBTOKEN_KEY);
  } catch (e) {
    if (token !== 'null') {
      saveLog(e, req, 'Error parse token', { token });
    }
    return null;
  }
  return data;
}

/**
 * Создает хеш пароля и возвращает либо объект ответа пользователю с ошибкой
 * либо успешный объект ответа, в data которого записан хеш
 * @param password [string] пароль
 * @param req [Express.Request] контекст запроса
 */
export async function createPasswordHash(
  string: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  req: Types.E.Request
): Promise<Types.Api.Result<null | string>> {
  const { lang } = req.body;
  // Получает хеш пароля
  const hash = await createHash(string, PASSWORD_SALT_ROUNDS, req, 'Create password hash failed');
  // Если createHash вернул не строку значит там ошибка
  if (typeof hash !== 'string') {
    return {
      status: 'error',
      message: lang.SERVER_ERROR,
      stdErrMessage: getStdErrMessage(hash),
      code: CODES.password,
      data: null,
    };
  }
  return {
    status: 'success',
    message: '',
    data: hash,
  };
}

/**
 * Сверяет пароль пользователя с хешем пароля записанным в базу
 * @param passwordUser [string] пароль переданный пользователем
 * @param passwordBase [string] пароль сохраненный в базе
 * @param req [Express.Request] контекст запроса
 */
export async function comparePasswords(
  passwordUser: string,
  passwordBase: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  req: Types.E.Request
): Promise<Types.Api.Result<null | boolean>> {
  const { lang } = req.body;
  // Сверяет пароли
  const compRes: boolean | Error = await compareHash(
    passwordUser,
    passwordBase,
    req,
    'Error compare passwords'
  );
  // Если вернулся не boolean значит там ошибка
  if (typeof compRes !== 'boolean') {
    return {
      status: 'error',
      message: lang.SERVER_ERROR,
      stdErrMessage: getStdErrMessage(compRes),
      data: null,
    };
  }
  // Возвращает ответ с результатом сверки в data
  return {
    status: 'success',
    message: '',
    data: compRes,
  };
}

//// Отправка email

const { SMTP_EMAIL, SMTP_PASS, SMTP_HOST, SMTP_PORT }: any = process.env;

/**
 * На всякий случай описан тип успешной отпраки nodemailer
 * Пока нигде не используется // TODO рассмотрение к удалению
 */
interface NodemailerResult {
  accepted: string[];
  rejected: string[];
  envelopeTime: number;
  messageTime: number;
  messageSize: number;
  response: string;
  envelope: {
    from: string;
    to: string[];
  };
  messageId: string;
}

//// Для добаления новых переменных письма, добавляем здесь
export interface SendEmailParams {
  lang: Types.Locale;
  email: string;
  type: Letter;
  name: string;
  link: string;
}

//// Для добаления нового типа письма, добавлем здесь
type Letter = 'confirm' | 'forgot';

interface EmailObject {
  html: string;
  text: string;
}

//// Для добаления нового типа письма, добавлем здесь
interface EmailLanguageObject {
  confirm: {
    [lang: string]: EmailObject;
  };
  forgot: {
    [lang: string]: EmailObject;
  };
  request: {
    [lang: string]: EmailObject;
  };
}

export class Email {
  private transporter: Mail;
  private emailObject: EmailLanguageObject;

  constructor() {
    // TODO
    this.transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: parseInt(SMTP_PORT, 10),
      secure: false,
      auth: {
        user: SMTP_EMAIL,
        pass: SMTP_PASS,
      },
    });
    //// Для добаления нового типа письма, добавлем здесь
    this.emailObject = {
      confirm: {},
      forgot: {},
      request: {},
    };
  }

  /**
   * Безопасно получает html письма подтверждения email
   */
  private getEmail(lang: Types.Locale, type: Letter, data: SendEmailParams): EmailObject {
    if (!this.emailObject[type][lang.value]) {
      // Инициализирует дефолтные значения
      this.emailObject[type][lang.value] = {
        html: '',
        text: '',
      };
      // Пытается получить html письма на языке пользователя
      try {
        this.emailObject[type][
          lang.value
          // eslint-disable-next-line @typescript-eslint/no-var-requires
        ].html = require(`../locales/letters/${lang.value}/${type}.html`).default;
      } catch (e) {
        // Если не найдено тогда ставим английский
        this.emailObject[type][
          lang.value
          // eslint-disable-next-line @typescript-eslint/no-var-requires
        ].html = require(`../locales/letters/en/${type}.html`).default;
      }
      // Получает текст из html для отдельных клиентов
      this.emailObject[type][lang.value].text = htmlToText(
        this.emailObject[type][lang.value].html,
        {
          wordwrap: 130,
        }
      );
    }
    // Меняет переменные для конкретного пользователя
    const { html, text } = this.emailObject[type][lang.value];
    return {
      html: this.changeVariables(html, data),
      text: this.changeVariables(text, data),
    };
  }

  //// Для добаления новых переменных письма, добавлем здесь
  /**
   * Заменяет переменные в html шаблоне на полученные параметры
   * @param html [string] исходный текст html
   * @param name [string] имя пользователя
   * @param link [string] динамичная ссылка
   */
  private changeVariables(html: string, data: SendEmailParams): string {
    return html.replace(/{link}/g, data.link || '').replace(/{name}/g, data.name || '');
  }

  public async sendEmail(
    req: Types.E.Request,
    params: SendEmailParams
  ): Promise<Types.Api.Result<NodemailerResult | undefined>> {
    const { lang, type, email } = params;
    const mail = this.getEmail(lang, type, params);
    const { html, text } = mail;
    return await new Promise((resolve) => {
      const options = {
        from: `Boring Weekend 👻' <${SMTP_EMAIL}>`,
        to: email,
        subject: `${SMTP_EMAIL} 🗨️`,
        text,
        html,
      };
      const info = this.transporter.sendMail(options);
      info
        .then((data: NodemailerResult) => {
          resolve({
            status: SUCCESS,
            message: lang.DATA_SEND,
            data,
          });
        })
        .catch((e: Error) => {
          saveLog(e, req, 'Error send email to user', { options });
          resolve({
            status: ERROR,
            message: lang.SERVER_ERROR,
            stdErrMessage: getStdErrMessage(e),
            data: null,
          });
        });
    });
  }
}

/**
 * Простой контекст для вызова без контекста
 * @param pathname [string]
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getEmptyRequest(url: string): any {
  return { url };
}
