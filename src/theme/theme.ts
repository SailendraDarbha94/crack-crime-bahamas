import { createSystem, defaultConfig } from "@chakra-ui/react";

const customTheme = createSystem(defaultConfig, {
  theme: {
    tokens: {
      fonts: {
        heading: { value: "'Nunito', sans-serif" },
        body: { value: "'Nunito', sans-serif" },
      },
    },
  },
});

export default customTheme;