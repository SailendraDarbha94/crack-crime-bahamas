"use client"
import React from "react";
import {Card, CardHeader, CardBody, CardFooter, Divider, Link, Image} from "@nextui-org/react";

export default function BasicCard({title, subtitle, description, urllink, urltext}:any) {
  return (
    <Card className="m-2 flex">
      <CardHeader className="flex gap-3">
        <Image
          alt="nextui logo"
          height={40}
          radius="sm"
          src="https://avatars.githubusercontent.com/u/86160567?s=200&v=4"
          width={40}
        />
        <div className="flex flex-col">
          <p className="text-md">{title}</p>
          <p className="text-small text-default-500">{subtitle}</p>
        </div>
      </CardHeader>
      <Divider/>
      <CardBody>
        <p>{description}</p>
      </CardBody>
      <Divider/>
      <CardFooter>
        <Link
          isExternal
          showAnchorIcon
          href={urllink}
          className="mx-auto"
        >
          {urltext}
        </Link>
      </CardFooter>
    </Card>
  );
}
