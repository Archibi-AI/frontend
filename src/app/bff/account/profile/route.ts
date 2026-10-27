import { z } from "zod";
import { updateUserProfile } from "@/features/account/server/repository";
import { bffHandler } from "@/server/bff/handler";
import { getSessionTokens, writeUser } from "@/server/session/cookies";
import { jwtExpMs } from "@/server/session/jwt";
import { AppError } from "@/shared/errors/app-error";

const MAX_BYTES = 5 * 1024 * 1024;
const Input = z.custom<FormData>((v) => v instanceof FormData);

/** PUT multipart, exactly the app's: `username` only when non-blank, `profilePicture` (image/png) only when present. */
export const PUT = bffHandler<FormData, { message: string; user: { uuid: string; username: string; email: string; imageUri: string } }>(
  { input: Input, inputFrom: "form" },
  async (incoming, { session }) => {
    const out = new FormData();
    const username = String(incoming.get("username") ?? "").trim();
    if (username) out.set("username", username);
    const picture = incoming.get("profilePicture");
    if (picture instanceof File && picture.size > 0) {
      if (!picture.type.startsWith("image/")) throw new AppError("UNKNOWN", 400, "Image format not supported. Conversion failed.");
      if (picture.size > MAX_BYTES) throw new AppError("UNKNOWN", 400, "Image is too large (max 5 MB).");
      out.set("profilePicture", picture, picture.name || "profile.png");
    }
    const res = await updateUserProfile(out, session);
    const { user, refresh } = await getSessionTokens();
    const next = { uuid: user?.uuid ?? "", username: res.updatedUserData.username, email: user?.email ?? "", imageUri: res.updatedUserData.imageUri ?? "" };
    if (user && refresh) writeUser(session, next, jwtExpMs(refresh));
    return { message: res.message, user: next };
  },
);
