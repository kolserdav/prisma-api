/******************************************************************************************
 * Repository: https://github.com/prisma-api/prisma-api
 * Author: Prisma Api Community
 * Email: <prisma.api.community@gmail.com>
 * License: MIT
 * License Text: THE SOFTWARE IS PROVIDED 'AS IS'
 * Copyright: prisma-api (c), All rights reserved
 * Create date: Sat Oct 16 2021 00:29:34 GMT+0700 (Krasnoyarsk Standard Time)
 ******************************************************************************************/
import fs from 'fs';
import path from 'path';

export function script(arg1: string, filePath: string) {
  let data;
  switch (arg1) {
    case 'env':
      data = fs.readFileSync(filePath).toString();
      data = '#!/usr/bin/env node\n' + data;
      fs.writeFileSync(filePath, data);
      fs.chmodSync(filePath, '755');
      console.info(`Set up env for file ${filePath}`);
      break;
    default:
  }
}

const filePath = path.resolve(__dirname, '../bin/prisma-api.js');

script(process.argv[2], filePath);
