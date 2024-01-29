import { httpReq } from "@/lib/http";
import { Button, Input } from "@nextui-org/react";
import React, { useEffect, useState } from "react";

export default function ApiTester () {
  
  const [path, setPath] = useState<string>("");
  const [method, setMethod] = useState<string>("");
  const [response, setResponse] = useState<any>(null);

  const httpReqMaker = async () => {
    try {
      const res = await httpReq(path, method);
      const data = await res?.json();
      console.log(data);
      setResponse(data);
    } catch (error) {
      console.log(error);
      setResponse(error);
    }
  };

  return (
    <div className="flex flex-col w-full h-full justify-center items-center">
      <h1 className="text-center w-full text-lg font-semibold my-2 p-2 max-h-fit">
        Test the APIs
      </h1>
      <p>Enter the Path after BaseURL and Method</p>
      <Input
        className="max-w-96 my-2"
        name="address"
        value={path}
        type="text"
        label="Path"
        placeholder="/test/api"
        onChange={(e) => setPath(e.target.value)}
      />
      <Input
        className="max-w-96 my-2"
        name="address"
        value={method}
        type="text"
        label="Method"
        placeholder="GET,PUT,POST,DELETE"
        onChange={(e) => setMethod(e.target.value)}
      />
      <Button
        onPress={httpReqMaker}
        className="my-2"
        variant="flat"
        color="secondary"
      >
        Call API
      </Button>
      {response ? (
        <pre>
          <code>{JSON.stringify(response)}</code>
        </pre>
      ) : null}
    </div>
  );
};


