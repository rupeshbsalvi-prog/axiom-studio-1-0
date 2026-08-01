export interface PhotoGatewaySessionResult {
  success: boolean;
  code?: string;
}

export async function establishPhotoGatewaySession(input: {
  gatewayUrl: string;
  accessToken: string;
}): Promise<PhotoGatewaySessionResult> {
  let sessionUrl: URL;
  try {
    sessionUrl = new URL(input.gatewayUrl);
    if (!sessionUrl.pathname.endsWith("/provider-gateway")) throw new Error("Unexpected gateway path");
    sessionUrl.pathname = sessionUrl.pathname.replace(/\/provider-gateway$/, "/provider-session");
  } catch {
    return { success: false, code: "gateway_session_url_invalid" };
  }

  try {
    const response = await fetch(sessionUrl.toString(), {
      method: "POST",
      credentials: "include",
      headers: { Authorization: `Bearer ${input.accessToken}` },
    });
    return response.ok
      ? { success: true }
      : { success: false, code: `gateway_session_http_${response.status}` };
  } catch {
    return { success: false, code: "gateway_session_network_error" };
  }
}

export function establishConfiguredPhotoGatewaySession(accessToken: string): Promise<PhotoGatewaySessionResult> {
  const viteEnv = (import.meta as unknown as { env?: Record<string, string | undefined> }).env;
  const processEnv =
    typeof globalThis !== "undefined" && "process" in globalThis
      ? ((globalThis as any).process?.env as Record<string, string | undefined>)
      : undefined;
  const gatewayUrl = viteEnv?.VITE_PHOTO_DEV_GATEWAY ?? processEnv?.VITE_PHOTO_DEV_GATEWAY;
  return gatewayUrl
    ? establishPhotoGatewaySession({ gatewayUrl, accessToken })
    : Promise.resolve({ success: false, code: "gateway_env_var_missing" });
}
