import { supabase } from "./supabase";

const baseUrl = "https://ayuryoj.azurewebsites.net";

export const httpReq = async (path: string, meth: string) => {
  const { data } = await supabase.auth.getSession();
  const token = data ? await data.session?.access_token : null

  if (token) {
    return await fetch(`${baseUrl}${path}`, {
      method: meth,
      headers: {
        accept: "application/json",
        authorization: `Bearer ${token}`,
        "Content-Type": "Application/json",
      },
    });
  } else {
    throw new Error("Bearer token 404")
  }
};
