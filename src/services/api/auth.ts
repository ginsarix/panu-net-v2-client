import { trpc } from '../trpc';

export const login = async (email: string, password: string) =>
  await trpc.auth.login.mutate({ email, password });
export const verifyEmail = async (identifier: string, verificationCode: string) =>
  await trpc.auth.verifyEmail.mutate({ identifier, verificationCode });

export const logout = async () => await trpc.auth.logout.mutate();
export const getLogin = async () => await trpc.auth.getLogin.query();

export const resetPassword = async (email: string, newPassword: string) =>
  await trpc.auth.resetPassword.mutate({ email, newPassword });
export const verifyPasswordReset = async (identifier: string, verificationCode: string) =>
  await trpc.auth.verifyPasswordReset.mutate({ identifier, verificationCode });
