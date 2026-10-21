import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const BUCKET = "resumes";
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const PDF_MIME = "application/pdf";
const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

async function getAuthenticatedUser() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) return null;
  return user;
}

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) return jsonError("Please sign in to manage your resume.", 401);

  try {
    const admin = createAdminClient();
    const { data: profile, error } = await admin
      .from("profiles")
      .select("resume_path")
      .eq("id", user.id)
      .maybeSingle();

    if (error) throw error;
    if (!profile?.resume_path) return NextResponse.json({ resume: null });

    // Never create a download URL for a path outside this user's private folder.
    if (!profile.resume_path.startsWith(`${user.id}/`)) {
      return jsonError("The saved resume path is invalid. Please upload your resume again.", 500);
    }

    const { data, error: signedUrlError } = await admin.storage
      .from(BUCKET)
      .createSignedUrl(profile.resume_path, 600);

    if (signedUrlError) throw signedUrlError;

    return NextResponse.json({
      resume: {
        fileName: profile.resume_path.split("/").pop() ?? "resume",
        downloadUrl: data.signedUrl,
      },
    });
  } catch {
    return jsonError("Resume storage is not configured. Apply the resume storage migration and check server environment variables.", 503);
  }
}

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return jsonError("Please sign in before uploading a resume.", 401);

  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > MAX_FILE_SIZE + 256 * 1024) {
    return jsonError("The upload is too large. Maximum resume size is 5 MB.", 413);
  }

  let file: File;
  try {
    const formData = await request.formData();
    const candidate = formData.get("file");
    if (!(candidate instanceof File)) {
      return jsonError("Choose a PDF or DOCX resume to upload.", 400);
    }
    file = candidate;
  } catch {
    return jsonError("Could not read the uploaded file.", 400);
  }

  if (file.size === 0) return jsonError("The selected file is empty.", 400);
  if (file.size > MAX_FILE_SIZE) return jsonError("The maximum resume size is 5 MB.", 413);

  const extension = file.name.toLowerCase().split(".").pop();
  if (extension !== "pdf" && extension !== "docx") {
    return jsonError("Only PDF and DOCX resumes are supported.", 415);
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const isPdf = extension === "pdf"
    && bytes.length >= 5
    && new TextDecoder().decode(bytes.slice(0, 5)) === "%PDF-";
  const isZip = bytes.length >= 4
    && bytes[0] === 0x50
    && bytes[1] === 0x4b
    && bytes[2] === 0x03
    && bytes[3] === 0x04;
  const isDocx = extension === "docx" && isZip;

  if (!isPdf && !isDocx) {
    return jsonError("The file content does not match a supported PDF or DOCX document.", 415);
  }

  const contentType = isPdf ? PDF_MIME : DOCX_MIME;
  const safeOriginalName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-100) || `resume.${extension}`;
  const storagePath = `${user.id}/${crypto.randomUUID()}-${safeOriginalName}`;

  try {
    const admin = createAdminClient();
    const { data: existingProfile, error: readError } = await admin
      .from("profiles")
      .select("resume_path")
      .eq("id", user.id)
      .maybeSingle();

    if (readError) throw readError;

    const { error: uploadError } = await admin.storage.from(BUCKET).upload(storagePath, Buffer.from(bytes), {
      contentType,
      cacheControl: "3600",
      upsert: false,
    });

    if (uploadError) throw uploadError;

    const { error: profileError } = await admin.from("profiles").upsert(
      { id: user.id, resume_path: storagePath, full_name: existingProfile?.full_name?.trim() || (typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name.trim() : "") || safeOriginalName.replace(/\\.(pdf|docx)$/i, "").replace(/[_-]+/g, " ").trim() },
      { onConflict: "id" },
    );

    if (profileError) {
      await admin.storage.from(BUCKET).remove([storagePath]);
      throw profileError;
    }

    const oldPath = existingProfile?.resume_path;
    if (oldPath && oldPath !== storagePath && oldPath.startsWith(`${user.id}/`)) {
      await admin.storage.from(BUCKET).remove([oldPath]);
    }

    const { data: signed, error: signedError } = await admin.storage
      .from(BUCKET)
      .createSignedUrl(storagePath, 600);

    if (signedError) throw signedError;

    return NextResponse.json({
      message: "Resume uploaded successfully.",
      resume: { fileName: safeOriginalName, downloadUrl: signed.signedUrl },
    });
  } catch {
    return jsonError("Resume upload failed. Check that the private storage migration has been applied and Supabase is configured.", 503);
  }
}

export async function DELETE() {
  const user = await getAuthenticatedUser();
  if (!user) return jsonError("Please sign in to manage your resume.", 401);

  try {
    const admin = createAdminClient();
    const { data: profile, error: readError } = await admin
      .from("profiles")
      .select("resume_path")
      .eq("id", user.id)
      .maybeSingle();

    if (readError) throw readError;
    const path = profile?.resume_path;

    if (!path) return NextResponse.json({ message: "No resume is currently saved." });
    if (!path.startsWith(`${user.id}/`)) {
      return jsonError("The saved resume path is invalid.", 500);
    }

    const { error: updateError } = await admin
      .from("profiles")
      .update({ resume_path: null })
      .eq("id", user.id);

    if (updateError) throw updateError;

    const { error: removeError } = await admin.storage.from(BUCKET).remove([path]);
    if (removeError) {
      return NextResponse.json({ message: "Resume removed from your profile. Storage cleanup may need a retry." });
    }

    return NextResponse.json({ message: "Resume deleted successfully." });
  } catch {
    return jsonError("Could not delete the resume. Please try again.", 503);
  }
}
