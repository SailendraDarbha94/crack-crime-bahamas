"use client"
import Fonts from "../../theme/fonts"
import { ChakraProvider, defaultSystem } from "@chakra-ui/react"
import {
  ColorModeProvider,
  type ColorModeProviderProps,
} from "./color-mode"
import customTheme from "@/theme/theme"
export function Provider(props: ColorModeProviderProps) {
  return (
    <ChakraProvider value={customTheme}>
      <Fonts />
      <ColorModeProvider {...props} />
    </ChakraProvider>
  )
}
