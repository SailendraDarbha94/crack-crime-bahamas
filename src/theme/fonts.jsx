import { Global } from "@emotion/react";

const Fonts = () => (
  <Global
    styles={`
      @font-face {
        font-family: 'nunito';
        src: url('/fonts/Nunito-VariableFont_wght.ttf') format('ttf');
      }
    `}
  />
);

export default Fonts;