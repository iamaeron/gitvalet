import { invoke } from "@tauri-apps/api/core";

export type DeviceCodeResponse = {
  device_code: string;
  user_code: string;
  verification_uri: string;
  expires_in: number;
  interval: number;
};

export type GitHubEmail = {
  email: string;
  primary: boolean;
  verified: boolean;
  visibility: "public" | "private" | null;
};

export async function getGitHubEmails(token: string): Promise<GitHubEmail[]> {
  const res = await fetch("https://api.github.com/user/emails", {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
    },
  });
  return res.json();
}

export const requestDeviceCode = () =>
  invoke<DeviceCodeResponse>("request_device_code");

export const pollForToken = (device_code: string, interval: number) =>
  invoke<string>("poll_for_token", { deviceCode: device_code, interval });
