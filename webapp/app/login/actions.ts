"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { findUserForLogin } from "@/lib/auth/lookup";
import { verifyPassword } from "@/lib/auth/passwords";
import { createSessionCookie } from "@/lib/auth/session";
import { isCustomer } from "@/lib/rbac";

const LoginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

export type LoginState = { error: string } | undefined;

export async function login(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = LoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: "Enter a valid email and password." };
  }

  const user = await findUserForLogin(parsed.data.email);
  const valid = user ? await verifyPassword(parsed.data.password, user.passwordHash) : false;
  if (!user || !valid) {
    return { error: "Invalid email or password." };
  }

  await createSessionCookie({
    userId: user.id,
    organizationId: user.organizationId,
    role: user.role,
    enterpriseAccountId: user.enterpriseAccountId,
    siteEnrollmentId: user.siteEnrollmentId,
    name: user.name,
    email: user.email,
  });

  redirect(isCustomer(user.role) ? "/portal/dashboard" : "/console/dashboard");
}
