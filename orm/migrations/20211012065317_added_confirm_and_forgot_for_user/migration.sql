-- AlterTable
ALTER TABLE `User` ADD COLUMN `confirmKey` VARCHAR(191),
    ADD COLUMN `confirmed` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `createConfirm` DATETIME(3),
    ADD COLUMN `createForgot` DATETIME(3),
    ADD COLUMN `forgotKey` VARCHAR(191);
