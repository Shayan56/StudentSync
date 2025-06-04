import { Global, css } from '@emotion/react';

const GlobalStyles = () => (
  <Global
    styles={css`
      @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700&display=swap');
      body {
        background: linear-gradient(135deg, #1E3A8A 0%, #1E1E3B 100%);
        margin: 0;
        padding: 0;
        overflow-x: hidden;
      }
      * {
        scrollbar-width: thin;
        scrollbar-color: #A855F7 #1E3A8A;
      }
      *::-webkit-scrollbar {
        width: 8px;
      }
      *::-webkit-scrollbar-track {
        background: #1E3A8A;
      }
      *::-webkit-scrollbar-thumb {
        background: #A855F7;
        border-radius: 4px;
      }
    `}
  />
);

export default GlobalStyles;