import "@fontsource/rubik";
import type { AppProps } from "next/app";
import { Box, ChakraProvider } from "@chakra-ui/react";
import theme from "../theme";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-wallets";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { env } from "../env/config";

require("@solana/wallet-adapter-react-ui/styles.css");

const wallets = [new PhantomWalletAdapter()];
function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ChakraProvider theme={theme}>
      <Box {...pageStyle}>
        <ConnectionProvider endpoint={env.cluster}>
          <WalletProvider wallets={wallets}>
            <WalletModalProvider>
              <Component {...pageProps} />
            </WalletModalProvider>
          </WalletProvider>
        </ConnectionProvider>
      </Box>
    </ChakraProvider>
  );
}

const pageStyle = {
  backgroundColor: "#ffffff",
  opacity: 0.8,
  backgroundImage: "radial-gradient(#CACACA 0.5px, #ffffff 0.5px)",
  backgroundSize: "10px 10px",
  height: "100vh",
};

export default MyApp;
