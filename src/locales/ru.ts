/******************************************************************************************
 * Repository: https://github.com/prisma-api/prisma-api
 * Author: Prisma Api Community
 * Email: <prisma.api.community@gmail.com>
 * License: MIT
 * License Text: THE SOFTWARE IS PROVIDED 'AS IS'
 * Copyright: prisma-api (c), All rights reserved
 * Create date: Thu Oct 14 2021 17:46:52 GMT+0700 (Krasnoyarsk Standard Time)
******************************************************************************************/
import type { Locale } from './types';
import { MINIMAL_PASSWORD_LENGTH } from '../utils';
export const locale: Locale = {
  value: 'ru',
  SERVER_ERROR: 'Server error',
  DATA_RECEIVED: 'Data received',
  NOT_FOUND: 'Not found',
  EMAIL_IS_REQUIRED: 'Email is required',
  PASSWORD_IS_REQUIRED: 'Password is required',
  PASSWORD_REPEAT_IS_REQUIRED: 'Password repeat is required',
  PASSWORDS_DO_NOT_MATCH: 'Passwords do not match',
  PASSWORD_IS_TOO_SHORT: `Minimal password length is ${MINIMAL_PASSWORD_LENGTH} symbols`,
  EMAIL_IS_INVALID: 'Email is invalid',
  BAD_REQUEST: 'Bad request',
  EMAIL_WAS_REGISTERED_EARLIER: 'This email was registered earlier',
  DATA_SEND: 'Data send successfully',
  DATA_UPDATED: 'Data updated successfully',
  DATA_SAVED: 'Data saved successfully',
  SUCCESS_REGISTRATION: 'Success registration',
  EMAIL_CANT_SEND: "Can't send email",
  FORBIDDEN: 'Forbidden',
  UNAUTHORIZED: 'Unauthorized',
  LINK_EXPIRED: 'Link expired',
  EMAIL_CONFIRMED: 'Email confirmed successfully',
  USER_NOT_FOUND: 'User not found',
  INVALID_CREDENTIALS: 'Invalid credentials',
  SUCCESS_LOGIN: 'Success login',
  OLD_PASSWORD_IS_REQUIRED: 'Old password is required',
  PASSWORD_CHANGED: 'Password change successfully',
  EMAIL_IS_SEND: 'On your email was send the active link',
  FORGOT_RECEIVED: 'Key for change password received',
  DELETED: 'Deleted successfully',
  CATEGORY_TITLE_EXISTS: 'Category with the same title are exists',
};
