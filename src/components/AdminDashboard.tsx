"use client";

import {
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Chip,
  Divider,
  Input,
  Link,
  Spinner,
} from "@nextui-org/react";
import { createClient } from "@supabase/supabase-js";
import React, { useEffect, useState } from "react";

const AdminDashboard = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [normalEmail, setNormalEmail] = useState<string>("");
  const [normalPassword, setNormalPassword] = useState<string>("");
  const [usersList, setUsersList] = useState<any>();
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE as string,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );

  const adminAuthClient = supabase.auth.admin;
  const fetchAllUsers = async () => {
    setLoading(true);
    const {
      data: { users },
      error,
    } = await supabase.auth.admin.listUsers();
    if (!error) {
      console.log(users);
      setUsersList(users);
      setLoading(false);
    }
    setLoading(false);
  };

  const deleteUser = async (params: string) => {
    setLoading(true);
    const { data, error } = await supabase.auth.admin.deleteUser(params);
    if (!error) {
      console.log(data);
      fetchAllUsers();
      setLoading(false);
    }
  };

  const createClinicLevelUser = async () => {
    const { data, error } = await adminAuthClient.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: { user_role: "clinic" },
    });

    if (error) {
      console.log(error);
    }
    if (data) {
      setEmail("");
      setPassword("");
      console.log(data);
    }
  };
  const createUser = async () => {
    const { data, error } = await adminAuthClient.createUser({
      email: normalEmail,
      password: normalPassword,
      email_confirm: true,
    });

    if (error) {
      console.log(error);
    }
    if (data) {
      setNormalEmail("");
      setNormalPassword("");
      console.log(data);
    }
  };
  return (
    <div className="flex w-full flex-wrap justify-center">
      <div className="w-full md:w-[48%] mx-auto">
        <div className="w-full p-4 h-80 bg-slate-300 shadow-lg rounded-lg">
          <p className="flex w-full h-12 justify-center items-center text-lg font-semibold">
            Create a Clinic Level User
          </p>
          <Divider />
          <div className="flex flex-col w-full h-full justify-start p-2 items-center">
            <Input
              className="w-80 my-2"
              name="email"
              value={email}
              type="email"
              label="Email"
              placeholder=""
              onChange={(e) => setEmail(e.target.value)}
            />
            <Input
              className="w-80 my-2"
              name="password"
              value={password}
              type="password"
              label="Password"
              placeholder=""
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button
              color="primary"
              onPress={createClinicLevelUser}
              variant="flat"
              className="mx-auto my-auto"
            >
              Submit
            </Button>
          </div>
        </div>
        <div className="w-full mt-4 p-4 h-80 bg-slate-300 shadow-lg rounded-lg">
          <p className="flex w-full h-12 justify-center items-center text-lg font-semibold">
            Create a Normal User
          </p>
          <Divider />
          <div className="flex flex-col w-full h-full justify-start p-2 items-center">
            <Input
              className="w-80 my-2"
              name="email"
              value={email}
              type="email"
              label="Email"
              placeholder=""
              onChange={(e) => setNormalEmail(e.target.value)}
            />
            <Input
              className="w-80 my-2"
              name="password"
              value={password}
              type="password"
              label="Password"
              placeholder=""
              onChange={(e) => setNormalPassword(e.target.value)}
            />
            <Button
              color="primary"
              onPress={createUser}
              variant="flat"
              className="mx-auto my-auto"
            >
              Submit
            </Button>
          </div>
        </div>
      </div>

      <div className="w-full md:w-[48%] mx-auto p-4 bg-slate-300 shadow-lg rounded-lg">
        <div className="flex w-full ">
          {!usersList ? (
            <>
              <Button
                color="primary"
                onPress={fetchAllUsers}
                variant="flat"
                className="mx-auto mb-2"
              >
                List All Users
              </Button>
            </>
          ) : (
            <>
              <Button
                color="primary"
                onPress={() => setUsersList(null)}
                variant="flat"
                className="mx-auto mb-2"
              >
                Hide Users
              </Button>
            </>
          )}
        </div>
        <Divider />
        {loading ? (
          <div className="flex w-full justify-center">
            <Spinner size="lg" />
          </div>
        ) : null}
        {usersList ? (
          <div className="flex flex-col items-center justify-center">
            {usersList.map((user: any) => {
              return (
                <Card key={user.id} className="w-full my-1">
                  <CardHeader className="flex flex-wrap gap-3">
                    <Chip className="m-1 text-md">{user.email}</Chip>
                    <Chip className="text-small m-1 text-default-500">
                      {user.role}
                    </Chip>
                    <Chip className="text-small m-1 text-default-500">
                      Created At {user.created_at.split("T")[0]}
                    </Chip>
                    <Chip className="text-small m-1 text-default-500">
                      Phone {user.phone ? user.phone : "N/A"}
                    </Chip>
                  </CardHeader>
                  <Divider />
                  <CardBody>
                    <pre>
                      User MetaData
                      <br />
                      <code>{JSON.stringify(user.user_metadata)}</code>
                    </pre>
                  </CardBody>
                  <Divider />
                  <CardFooter>
                    <Button
                      color="danger"
                      onPress={() => deleteUser(user.id as string)}
                      variant="flat"
                      className="mx-auto text-center"
                    >
                      {loading ? <Spinner size="sm" /> : "Delete User"}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default AdminDashboard;
