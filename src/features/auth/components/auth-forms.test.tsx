import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse, type JsonBodyType } from "msw";
import { describe, expect, it } from "vitest";
import { nav, router } from "@/test/navigation-mock";
import { server } from "@/test/msw/server";
import { renderWithProviders, setupComponentTest } from "@/test/render";
import { ForgotPasswordForm } from "./forgot-password-form";
import { LoginForm } from "./login-form";
import { SignupForm } from "./signup-form";
import { VerifyForm } from "./verify-form";

setupComponentTest();
const ok = (body: JsonBodyType, status = 200) => HttpResponse.json(body, { status });
const err = (status: number, code: string, message: string) => HttpResponse.json({ error: { code, message } }, { status });
const user = { uuid: "u1", username: "a@b.co", email: "a@b.co", imageUri: "" };

async function fillLogin(email = "a@b.co", password = "Str0ng-pass!") {
  await userEvent.type(screen.getByLabelText("Email"), email);
  await userEvent.type(screen.getByLabelText("Password"), password);
  await userEvent.click(screen.getByRole("button", { name: "Sign in" }));
}

describe("LoginForm (LogInScreen / LogInViewModel)", () => {
  it("signs in and goes to /ideabank by default", async () => {
    let body: unknown;
    server.use(http.post("*/bff/auth/login", async ({ request }) => { body = await request.json(); return ok({ user, accountRestored: false }); }));
    renderWithProviders(<LoginForm />);
    await fillLogin();
    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/ideabank"));
    expect(body).toEqual({ email: "a@b.co", password: "Str0ng-pass!" });
  });

  it("honours a safe ?next and rejects an open redirect", async () => {
    server.use(http.post("*/bff/auth/login", () => ok({ user, accountRestored: false })));
    nav.search = "next=%2Fhiring%2Fwishlist";
    renderWithProviders(<LoginForm />);
    await fillLogin();
    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/hiring/wishlist"));
  });

  it("never follows an external next", async () => {
    server.use(http.post("*/bff/auth/login", () => ok({ user, accountRestored: false })));
    nav.search = "next=https%3A%2F%2Fevil.com";
    renderWithProviders(<LoginForm />);
    await fillLogin();
    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/ideabank"));
  });

  it("shows the app's wording for a wrong password and stays on the page", async () => {
    server.use(http.post("*/bff/auth/login", () => err(400, "PASSWORD_IS_NOT_VALID", "Your entered password is wrong.")));
    renderWithProviders(<LoginForm />);
    await fillLogin();
    expect(await screen.findByRole("alert")).toHaveTextContent("Your entered password is wrong.");
    expect(router.replace).not.toHaveBeenCalled();
  });

  it("shows the account-restored toast text from strings.xml", async () => {
    server.use(http.post("*/bff/auth/login", () => ok({ user, accountRestored: true })));
    renderWithProviders(<LoginForm />);
    await fillLogin();
    expect(await screen.findByText("Welcome back! Your account deletion was cancelled.")).toBeInTheDocument();
  });

  it("validates before calling the server", async () => {
    renderWithProviders(<LoginForm />);
    await userEvent.click(screen.getByRole("button", { name: "Sign in" }));
    expect(await screen.findByText("Enter your email.")).toBeInTheDocument();
    expect(router.replace).not.toHaveBeenCalled();
  });

  it("links to sign up, forgot password and the WordPress legal pages", () => {
    renderWithProviders(<LoginForm />);
    expect(screen.getByRole("link", { name: "Forgot password?" })).toHaveAttribute("href", "/auth/forgot-password");
    expect(screen.getByRole("link", { name: "Sign up" })).toHaveAttribute("href", "/auth/signup");
    expect(screen.getByRole("link", { name: "Privacy Policy" })).toHaveAttribute("href", "https://archibi.ca/privacy-policy/");
  });
});

describe("SignupForm (SignUpScreen)", () => {
  async function fill(password: string, confirm: string) {
    await userEvent.type(screen.getByLabelText("Email"), "new@b.co");
    await userEvent.type(screen.getByLabelText("Password"), password);
    await userEvent.type(screen.getByLabelText("Confirm password"), confirm);
    await userEvent.click(screen.getByRole("button", { name: "Create account" }));
  }

  it("blocks mismatching passwords", async () => {
    renderWithProviders(<SignupForm />);
    await fill("Str0ng-pass!", "different");
    expect(await screen.findByText("Passwords do not match.")).toBeInTheDocument();
    expect(router.push).not.toHaveBeenCalled();
  });

  it("success goes to the verification screen with the email", async () => {
    server.use(http.post("*/bff/auth/signup", () => ok({ message: "verification email has sent successfully." })));
    renderWithProviders(<SignupForm />);
    await fill("Str0ng-pass!", "Str0ng-pass!");
    await waitFor(() => expect(router.push).toHaveBeenCalledWith("/auth/signup/verify?email=new%40b.co"));
  });

  it("repeated email uses the app's text", async () => {
    server.use(http.post("*/bff/auth/signup", () => err(400, "REPEATED_EMAIL", "your entered email is repeated and already used, please try again with another email")));
    renderWithProviders(<SignupForm />);
    await fill("Str0ng-pass!", "Str0ng-pass!");
    expect(await screen.findByRole("alert")).toHaveTextContent("your entered email is repeated and already used");
  });

  it("shows the backend message for a pending-deletion email", async () => {
    server.use(http.post("*/bff/auth/signup", () => err(400, "UNKNOWN", "This email belongs to an account that is scheduled for deletion. Sign in to restore it.")));
    renderWithProviders(<SignupForm />);
    await fill("Str0ng-pass!", "Str0ng-pass!");
    expect(await screen.findByRole("alert")).toHaveTextContent("scheduled for deletion");
  });
});

describe("VerifyForm (EmailVerificationScreen)", () => {
  it("sends digits only and signs in with the app's success toast", async () => {
    let body: unknown;
    server.use(http.post("*/bff/auth/verify", async ({ request }) => { body = await request.json(); return ok({ user, accountRestored: false }); }));
    renderWithProviders(<VerifyForm email="a@b.co" />);
    await userEvent.type(screen.getByLabelText("Verification code"), "12 34 56");
    await userEvent.click(screen.getByRole("button", { name: /Verify/ }));
    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/ideabank"));
    expect(body).toEqual({ email: "a@b.co", code: "123456" });
    expect(await screen.findByText("Registered successfully!")).toBeInTheDocument();
  });

  it("shows the backend text for a wrong code", async () => {
    server.use(http.post("*/bff/auth/verify", () => err(400, "UNKNOWN", "invalid verification code!")));
    renderWithProviders(<VerifyForm email="a@b.co" />);
    await userEvent.type(screen.getByLabelText("Verification code"), "000000");
    await userEvent.click(screen.getByRole("button", { name: /Verify/ }));
    expect(await screen.findByRole("alert")).toHaveTextContent("invalid verification code!");
  });

  it("rejects a too-short code locally", async () => {
    renderWithProviders(<VerifyForm email="a@b.co" />);
    await userEvent.type(screen.getByLabelText("Verification code"), "12");
    await userEvent.click(screen.getByRole("button", { name: /Verify/ }));
    expect(await screen.findByText("Enter the code from your email.")).toBeInTheDocument();
  });
});

describe("ForgotPasswordForm (PasswordRecoveryScreen)", () => {
  async function submit() {
    await userEvent.type(screen.getByLabelText("Email"), "a@b.co");
    await userEvent.click(screen.getByRole("button", { name: "Send new password" }));
  }
  it("success shows the app's recovery text", async () => {
    server.use(http.post("*/bff/auth/forgot-password", () => ok({ message: "We Sent an Email to Your Email!" })));
    renderWithProviders(<ForgotPasswordForm />);
    await submit();
    expect(await screen.findByRole("status")).toHaveTextContent("Your new password has been sent to your email. Please Check and login with your new password");
  });
  it("unknown email shows the app's text", async () => {
    server.use(http.post("*/bff/auth/forgot-password", () => err(404, "EMAIL_IS_NOT_VALID_FORGET_PASSWORD", "You do not have account with this email")));
    renderWithProviders(<ForgotPasswordForm />);
    await submit();
    expect(await screen.findByRole("alert")).toHaveTextContent("You do not have account with this email");
  });
  it("throttled shows a retry-later message", async () => {
    server.use(http.post("*/bff/auth/forgot-password", () => err(429, "TOO_MANY_REQUESTS", "Too many attempts. Please try again later.")));
    renderWithProviders(<ForgotPasswordForm />);
    await submit();
    expect(await screen.findByRole("alert")).toHaveTextContent("Too many attempts");
  });
});
