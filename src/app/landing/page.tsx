import React from "react";
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Divider,
  Link,
  Image,
} from "@nextui-org/react";

const Page = () => {
  return (
    <div className="flex w-full flex-wrap min-h-screen">
      <div className="flex min-h-fit w-full flex-col items-center">
        <div className="w-full md:w-1/2 mx-auto p-4">
          <Card>
            <CardHeader className="flex gap-3">
              <Image
                alt="nextui logo"
                height={40}
                radius="sm"
                src="https://avatars.githubusercontent.com/u/86160567?s=200&v=4"
                width={40}
              />
              <div className="flex flex-col">
                <p className="text-md">For Dentists looking for Opportunity</p>
                {/* <p className="text-small text-default-500">nextui.org</p> */}
              </div>
            </CardHeader>
            {/* <Divider /> */}
            <CardBody>
              <p>Explore the Jobs posted by our partner clinics</p>
            </CardBody>
            <Divider />
            <CardFooter>
              <Link href="/jobs/list" className="mx-auto p-2 rounded-md">Search Jobs</Link>
              {/* <Link
                isExternal
                showAnchorIcon
                href="https://github.com/nextui-org/nextui"
              >
                Visit source code on GitHub.
              </Link> */}
            </CardFooter>
          </Card>
        </div>
        <div className="w-full md:w-1/2 mx-auto p-4">
          <Card>
            <CardHeader className="flex gap-3">
              <Image
                alt="nextui logo"
                height={40}
                radius="sm"
                src="https://avatars.githubusercontent.com/u/86160567?s=200&v=4"
                width={40}
              />
              <div className="flex flex-col">
                <p className="text-md">For Clinics looking for Dentists</p>
                {/* <p className="text-small text-default-500">nextui.org</p> */}
              </div>
            </CardHeader>
            {/* <Divider /> */}
            <CardBody>
              <p>
                Register your clinic and post jobs to attract dentists to work
                with you
              </p>
            </CardBody>
            <Divider />
            <CardFooter>
            <Link href="/register" className="mx-auto p-2 rounded-md">Register Clinic</Link>
              {/* <Link
                isExternal
                showAnchorIcon
                href="https://github.com/nextui-org/nextui"
              >
                Visit source code on GitHub.
              </Link> */}
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Page;
