import { ChangePasswordInputSchema } from "@/features/account/schemas";
import { changePasswordApi } from "@/features/account/server/repository";
import { bffHandler } from "@/server/bff/handler";

/** Mirrors AccountUpdateViewModel.changePassword. The app keeps its token; so does the web session. */
export const POST = bffHandler({ input: ChangePasswordInputSchema }, (b, { session }) => changePasswordApi(b.old_password, b.new_password, b.confirm_password, session));
