import type { DataError } from "./data-error";

/** Verbatim from KMP core/domain/model/Message.kt (CommonResponses). */
export const AppMessages = {
  serverError: "Sorry, the service is currently unavailable. Please try again in a few minutes.",
  somethingWrong: "someThing went wrong! please try again later or share your problem with us",
  repeatedEmail: "your entered email is repeated and already used, please try again with another email",
  wrongEmail: "Your entered email is wrong.",
  wrongPassword: "Your entered password is wrong.",
  wrongEmailForgetPassword: "You do not have account with this email",
  wrongOldPassword: "Old password is Incorrect!",
  recoveryEmailSent: "Your new password has been sent to your email. Please Check and login with your new password",
  accountUpdated: "Account is updated successfully!",
  subscriptionsUnavailable: "subscriptions unavailable",
  signedUp: "Registered successfully!",
  noInternet: "No Internet Connection!",
  userNotExist: "this user does not exist!",
  // web-only
  sessionExpired: "Your session has ended. Please sign in again.",
  tooManyRequests: "Too many attempts. Please try again later.",
} as const;

/** Matching strings the backend sends (HttpClientExt.kt:108-126, Message.kt). */
export const BackendSignals = {
  serviceNotInPlanCode: "service_not_in_plan",
  wrongUsername: "wrong username",
  wrongPassword: "wrong password",
  wrongOldPassword: "Old password is Incorrect!",
  wrongCode: "code is wrong!",
  outOfCredit: "out of credit",
  repeatedEmail: "email is already exist!",
  userNotExist: "this user does not exist!",
  invalidPage: "Invalid page",
  wrongEmailForgetPassword: "You do not have account with this email",
  subscriptionsUnavailableCode: "subscriptions_unavailable",
} as const;

export function defaultMessage(code: DataError): string {
  switch (code) {
    case "SERVER":
    case "REQUEST_TIMEOUT":
      return AppMessages.serverError;
    case "NO_INTERNET":
      return AppMessages.noInternet;
    case "REPEATED_EMAIL":
      return AppMessages.repeatedEmail;
    case "USERNAME_IS_NOT_VALID":
      return AppMessages.wrongEmail;
    case "PASSWORD_IS_NOT_VALID":
      return AppMessages.wrongPassword;
    case "EMAIL_IS_NOT_VALID_FORGET_PASSWORD":
      return AppMessages.wrongEmailForgetPassword;
    case "WRONG_OLD_PASSWORD":
      return AppMessages.wrongOldPassword;
    case "USER_NOT_EXIST":
      return AppMessages.userNotExist;
    case "UNAUTHORIZED":
      return AppMessages.sessionExpired;
    case "TOO_MANY_REQUESTS":
      return AppMessages.tooManyRequests;
    default:
      return AppMessages.somethingWrong;
  }
}
