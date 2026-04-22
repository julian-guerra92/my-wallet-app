-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "groupId" TEXT,
ADD COLUMN     "isTransfer" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "linkedAccountId" TEXT;
