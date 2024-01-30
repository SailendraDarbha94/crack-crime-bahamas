import React, { useEffect, useState } from "react";

export default function Toast({ message }: { message: string }) {

  return (
    <div>
      {message &&
        <div className="flex justify-center items-center fixed z-30 m-2 rounded-md p-2 right-0 top-0 w-96 h-20 font-sans text-black bg-slate-100 font-semibold text-lg">
          {message}
        </div>
      }
    </div>
  );
}
