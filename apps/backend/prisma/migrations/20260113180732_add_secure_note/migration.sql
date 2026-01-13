-- CreateTable
CREATE TABLE "SecureNote" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "lastViewedAt" TIMESTAMP(3),
    "maxViews" INTEGER,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,
    "userId" TEXT,

    CONSTRAINT "SecureNote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SecureNote_slug_key" ON "SecureNote"("slug");

-- CreateIndex
CREATE INDEX "SecureNote_slug_idx" ON "SecureNote"("slug");

-- CreateIndex
CREATE INDEX "SecureNote_expiresAt_idx" ON "SecureNote"("expiresAt");

-- AddForeignKey
ALTER TABLE "SecureNote" ADD CONSTRAINT "SecureNote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
