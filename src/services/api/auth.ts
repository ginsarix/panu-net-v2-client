import { trpc } from '../trpc';

const DEVICE_TOKEN_KEY = 'deviceToken';

export const login = async (email: string, password: string) => {
  const deviceToken = localStorage.getItem(DEVICE_TOKEN_KEY);
  const result = await trpc.auth.login.mutate({
    email,
    password,
    deviceToken: deviceToken || undefined,
  });

  if (result && 'deviceToken' in result && result.deviceToken) {
    localStorage.setItem(DEVICE_TOKEN_KEY, result.deviceToken);
  }

  return result;
};

export const verifyEmail = async (identifier: string, verificationCode: string) => {
  const result = await trpc.auth.verifyEmail.mutate({ identifier, verificationCode });

  if (result && 'deviceToken' in result && result.deviceToken) {
    localStorage.setItem(DEVICE_TOKEN_KEY, result.deviceToken);
  }

  return result;
};

export const logout = async () => {
  const deviceToken = localStorage.getItem(DEVICE_TOKEN_KEY);
  await trpc.auth.logout.mutate(deviceToken ? { deviceToken } : undefined);
  localStorage.removeItem(DEVICE_TOKEN_KEY);
};

export const getLogin = async () => await trpc.auth.getLogin.query();

export const resetPassword = async (email: string, newPassword: string) =>
  await trpc.auth.resetPassword.mutate({ email, newPassword });
export const verifyPasswordReset = async (identifier: string, verificationCode: string) =>
  await trpc.auth.verifyPasswordReset.mutate({ identifier, verificationCode });
