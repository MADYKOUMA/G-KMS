import { existsSync } from "fs";
import { mkdir, unlink, writeFile } from "fs/promises";
import { NextRequest, NextResponse } from "next/server";
import { join } from "path";

export const runtime = "nodejs";

function getImageKitAuthHeader() {
  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
  if (!privateKey) return null;
  const token = Buffer.from(`${privateKey}:`).toString("base64");
  return `Basic ${token}`;
}

function withImageKitFileId(url: string, fileId: string) {
  // Fragment is ignored by browsers for fetching the image,
  // but lets us retrieve fileId later for delete.
  return `${url}#ikfid=${encodeURIComponent(fileId)}`;
}

function parseImageKitFileId(pathOrUrl: string): string | null {
  const idx = pathOrUrl.indexOf("#ikfid=");
  if (idx === -1) return null;
  return decodeURIComponent(pathOrUrl.slice(idx + "#ikfid=".length));
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.formData();
    const file: File | null = data.get("file") as unknown as File;

    if (!file) {
      return NextResponse.json({ success: false, message: "Aucun fichier." }, { status: 400 });
    }

    const authHeader = getImageKitAuthHeader();
    if (!authHeader) {
      return NextResponse.json(
        { success: false, message: "IMAGEKIT_PRIVATE_KEY manquant." },
        { status: 500 },
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString("base64");
    const dataUrl = `data:${file.type || "application/octet-stream"};base64,${base64}`;

    const ext = file.name.split(".").pop();
    const fileName = `${crypto.randomUUID()}${ext ? `.${ext}` : ""}`;

    const body = new FormData();
    body.append("file", dataUrl);
    body.append("fileName", fileName);
    body.append("useUniqueFileName", "true");
    body.append("folder", "/asso_stock");

    const res = await fetch("https://upload.imagekit.io/api/v1/files/upload", {
      method: "POST",
      headers: {
        Authorization: authHeader,
      },
      body,
    });

    const json = await res.json().catch(() => null);
    if (!res.ok) {
      return NextResponse.json(
        { success: false, message: "Erreur ImageKit upload", details: json },
        { status: 502 },
      );
    }

    const url = json?.url as string | undefined;
    const fileId = json?.fileId as string | undefined;
    if (!url || !fileId) {
      return NextResponse.json(
        { success: false, message: "Réponse ImageKit invalide.", details: json },
        { status: 502 },
      );
    }

    return NextResponse.json({ success: true, path: withImageKitFileId(url, fileId) });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: "Erreur serveur." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { path } = await request.json();
    if (!path || typeof path !== "string") {
      return NextResponse.json({ success: false, message: "Chemin invalide." }, { status: 400 });
    }

    // Legacy local delete (/public/uploads/...)
    if (path.startsWith("/uploads/")) {
      const filePath = join(process.cwd(), "public", path);

      if (!existsSync(filePath)) {
        return NextResponse.json({ success: false, message: "Fichier non trouvé" }, { status: 404 });
      }

      await unlink(filePath);
      return NextResponse.json({ success: true, message: "Fichier supprimé (local)." }, { status: 200 });
    }

    // ImageKit delete (needs fileId stored in fragment)
    const fileId = parseImageKitFileId(path);
    if (!fileId) {
      // We can't delete remotely without fileId; don't block product deletion.
      return NextResponse.json({
        success: true,
        message: "Aucun fileId ImageKit trouvé, suppression distante ignorée.",
      });
    }

    const authHeader = getImageKitAuthHeader();
    if (!authHeader) {
      return NextResponse.json(
        { success: false, message: "IMAGEKIT_PRIVATE_KEY manquant." },
        { status: 500 },
      );
    }

    const res = await fetch(`https://api.imagekit.io/v1/files/${encodeURIComponent(fileId)}`, {
      method: "DELETE",
      headers: { Authorization: authHeader },
    });

    if (!res.ok) {
      const details = await res.text().catch(() => "");
      return NextResponse.json(
        { success: false, message: "Erreur ImageKit delete", details },
        { status: 502 },
      );
    }

    return NextResponse.json({ success: true, message: "Fichier supprimé (ImageKit)." }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: "Erreur serveur." }, { status: 500 });
  }
}