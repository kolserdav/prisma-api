/******************************************************************************************
 * Repository: https://github.com/prisma-api/prisma-api
 * Author: Prisma Api Community
 * Email: <prisma.api.community@gmail.com>
 * License: MIT
 * License Text: THE SOFTWARE IS PROVIDED 'AS IS'
 * Copyright: prisma-api (c), All rights reserved
 * Create date: Thu Oct 14 2021 17:46:52 GMT+0700 (Krasnoyarsk Standard Time)
******************************************************************************************/
export interface Locale {
  value: 'en' | 'ru' | 'uk';
  SERVER_ERROR: string;
  DATA_RECEIVED: string;
  NOT_FOUND: string;
  EMAIL_IS_REQUIRED: string;
  PASSWORD_IS_REQUIRED: string;
  PASSWORD_REPEAT_IS_REQUIRED: string;
  PASSWORDS_DO_NOT_MATCH: string;
  PASSWORD_IS_TOO_SHORT: string;
  EMAIL_IS_INVALID: string;
  BAD_REQUEST: string;
  EMAIL_WAS_REGISTERED_EARLIER: string;
  DATA_SEND: string;
  DATA_UPDATED: string;
  DATA_SAVED: string;
  SUCCESS_REGISTRATION: string;
  EMAIL_CANT_SEND: string;
  FORBIDDEN: string;
  UNAUTHORIZED: string;
  LINK_EXPIRED: string;
  EMAIL_CONFIRMED: string;
  USER_NOT_FOUND: string;
  INVALID_CREDENTIALS: string;
  SUCCESS_LOGIN: string;
  OLD_PASSWORD_IS_REQUIRED: string;
  PASSWORD_CHANGED: string;
  EMAIL_IS_SEND: string;
  FORGOT_RECEIVED: string;
  DELETED: string;
  CATEGORY_TITLE_EXISTS: string;
}
