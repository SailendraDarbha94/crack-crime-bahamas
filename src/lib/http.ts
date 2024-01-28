import { supabase } from "./supabase";

const baseUrl = "https://ayuryoj.azurewebsites.net";

export const httpReq = async (path: string, meth: string) => {
  const { data, error } = await supabase.auth.getSession();
  const token = data ? await data.session?.access_token : null

  if(error){
    throw new Error("Operation Unsuccessfull")
  }
  
  if (data) {
    return await fetch(`${baseUrl}${path}`, {
      method: meth,
      headers: {
        accept: "application/json",
        authorization: `Bearer ${token}`,
        "Content-Type": "Application/json",
      },
    });
  }
};
