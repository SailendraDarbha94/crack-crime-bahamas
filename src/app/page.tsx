"use client"
import Image from "next/image";
import { Flex, Heading } from "@chakra-ui/react"
import { Box } from "@chakra-ui/react"

export default function Home() {
  return (
    <Flex direction="column">
      <Box width="100%" padding={4} marginY={2}>
        <Heading
          className="text-center"
          fontWeight={800}
          fontSize={["4xl", "4xl", "5xl", "6xl", "7xl"]}
          paddingY={4}
        >Crack Crime Bahamas</Heading>
      </Box>
      <Box width="100%" background="yellow.300" padding={4} marginY={2}>
        2
      </Box>
      <Box width="100%" background="yellow.300" padding={4} marginY={2}>
        3
      </Box>
    </Flex>
  );
}
