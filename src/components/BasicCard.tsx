"use client"
import React from "react";
import {Card, CardHeader, CardBody, CardFooter, Button, Divider, Link, Image} from "@nextui-org/react";
import { CardProps } from "@/app/page";
import { useRouter } from "next/navigation";

export default function BasicCard({url, alt, text, btn, route}:CardProps) {
  const router = useRouter();
  return (
    <Card
      isFooterBlurred
      radius="lg"
      className="border-none min-h-60 min-w-60 m-2"
    >
      <Image
        alt={alt}
        className="object-cover"
        height={200}
        src={url}
        width={200}
      />
      <CardFooter className="justify-between before:bg-white/10 border-white/20 border-1 overflow-hidden py-1 absolute before:rounded-xl rounded-large bottom-1 w-[calc(100%_-_8px)] shadow-small ml-1 z-10">
        <p className="text-tiny">{text}</p>
        <Button className="text-tiny text-white bg-black/80" variant="flat" color="default" radius="lg" size="sm" onPress={() => router.push(route)}>
          {btn}
        </Button>
      </CardFooter>
    </Card>
  );
}
