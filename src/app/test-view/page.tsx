"use client";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { useEffect, useState } from "react";
const Page = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [data, setData] = useState<string>("");
  const setupFunc = async () => {
    const genAI = new GoogleGenerativeAI(
      process.env.NEXT_PUBLIC_GEMINI_KEY as string
    );
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = "Write a story about a magic backpack.";
    // REGULAR
    // const result = await model.generateContent(prompt);
    // const response = await result.response;
    // const text = response.text();
    // console.log(text);
    // STREAM
    const result = await model.generateContentStream([prompt]);
    // print text as it comes in
    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      setData((prev) => {
        let newText = prev + chunkText;
        return newText
      });
    }
  };

  useEffect(() => {}, []);

  return (
    <div className="w-full min-h-screen font-nunito">
      Page
      <div>
        <button className="bg-blue-200 p-2 rounded-md m-2" onClick={setupFunc}>Click</button>
        <p className="bg-sky-200 text-lg tracking-tighter font-semibold p-4">{data}</p>
      </div>
    </div>
  );
};

export default Page;
