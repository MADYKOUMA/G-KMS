import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { promises as fs } from "fs";
import path from "path";

const prisma = new PrismaClient();

function getArg(flag) {
  const i = process.argv.indexOf(flag);
  return i === -1 ? null : process.argv[i + 1] ?? null;
}

const DRY_RUN = process.argv.includes("--dry-run");
const DELETE_LOCAL = process.argv.includes("--delete-local");
const LIMIT = Number(getArg("--limit") ?? "0") || 0;

function getImageKitAuthHeader() {
  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
  if (!privateKey) return null;
  const token = Buffer.from(`${privateKey}:`).toString("base64");
  return `Basic ${token}`;
}

function withImageKitFileId(url, fileId) {
  return `${url}#ikfid=${encodeURIComponent(fileId)}`;
}

async function uploadToImageKit({ filePath, fileName, mimeType }) {
  const auth = getImageKitAuthHeader();
  if (!auth) throw new Error("Missing IMAGEKIT_PRIVATE_KEY in env.");

  const buffer = await fs.readFile(filePath);
  const base64 = buffer.toString("base64");
  const dataUrl = `data:${mimeType || "application/octet-stream"};base64,${base64}`;

  const body = new FormData();
  body.append("file", dataUrl);
  body.append("fileName", fileName);
  body.append("useUniqueFileName", "true");
  body.append("folder", "/asso_stock");

  const res = await fetch("https://upload.imagekit.io/api/v1/files/upload", {
    method: "POST",
    headers: { Authorization: auth },
    body,
  });

  const json = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(`ImageKit upload failed (${res.status}): ${JSON.stringify(json)}`);
  }

  if (!json?.url || !json?.fileId) {
    throw new Error(`ImageKit response invalid: ${JSON.stringify(json)}`);
  }

  return { url: json.url, fileId: json.fileId };
}

async function main() {
  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  console.log(`[migrate] uploadsDir = ${uploadsDir}`);
  console.log(`[migrate] dryRun=${DRY_RUN} deleteLocal=${DELETE_LOCAL} limit=${LIMIT || "∞"}`);

  // Only products referencing local uploads
  const products = await prisma.product.findMany({
    where: { imageUrl: { startsWith: "/uploads/" } },
    select: { id: true, imageUrl: true, name: true },
    take: LIMIT || undefined,
  });

  if (products.length === 0) {
    console.log("[migrate] No products with local images found.");
    return;
  }

  let ok = 0;
  let skipped = 0;
  let failed = 0;

  for (const p of products) {
    const localRel = p.imageUrl; // "/uploads/xxx.ext"
    const localAbs = path.join(process.cwd(), "public", localRel);
    const fileName = path.basename(localAbs);
    const ext = path.extname(fileName).toLowerCase();
    const mimeType =
      ext === ".png"
        ? "image/png"
        : ext === ".jpg" || ext === ".jpeg"
          ? "image/jpeg"
          : ext === ".webp"
            ? "image/webp"
            : ext === ".gif"
              ? "image/gif"
              : "application/octet-stream";

    try {
      await fs.access(localAbs);
    } catch {
      console.warn(`[migrate] SKIP missing file for product=${p.id} imageUrl=${p.imageUrl}`);
      skipped++;
      continue;
    }

    try {
      console.log(`[migrate] Uploading product=${p.id} (${p.name}) file=${fileName}`);

      const { url, fileId } = await uploadToImageKit({
        filePath: localAbs,
        fileName,
        mimeType,
      });

      const newImageUrl = withImageKitFileId(url, fileId);

      if (!DRY_RUN) {
        await prisma.product.update({
          where: { id: p.id },
          data: { imageUrl: newImageUrl },
        });
      }

      if (DELETE_LOCAL && !DRY_RUN) {
        await fs.unlink(localAbs);
      }

      ok++;
    } catch (e) {
      failed++;
      console.error(`[migrate] FAIL product=${p.id} imageUrl=${p.imageUrl}`);
      console.error(e);
    }
  }

  console.log(`[migrate] done ok=${ok} skipped=${skipped} failed=${failed}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

