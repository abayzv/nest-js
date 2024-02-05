-- AlterTable
ALTER TABLE "User" ADD COLUMN     "emailVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "otpNumber" INTEGER,
ADD COLUMN     "verificationToken" TEXT;
