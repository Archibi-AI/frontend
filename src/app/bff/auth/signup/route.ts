import { SignupInputSchema } from "@/features/auth/schemas";
import { userSignUpOneStep } from "@/features/auth/server/repository";
import { bffHandler } from "@/server/bff/handler";

/** Mirrors SignUpViewModel.signUpApiServiceApi (A2). No session is created until the email is verified. */
export const POST = bffHandler({ input: SignupInputSchema }, ({ email, password }) => userSignUpOneStep(email, password));
