-- AlterTable: add OTP fields to LunchOrder
ALTER TABLE "LunchOrder"
  ADD COLUMN "otp_code"       VARCHAR(6),
  ADD COLUMN "otp_expires_at" TIMESTAMP(3);

-- CreateTable: RefreshToken
CREATE TABLE "RefreshToken" (
    "id"         UUID         NOT NULL,
    "user_id"    UUID         NOT NULL,
    "token_hash" TEXT         NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RefreshToken_token_hash_idx" ON "RefreshToken"("token_hash");

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
