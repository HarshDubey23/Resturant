import { Inter, Montserrat } from "next/font/google";

export const montserrat = Montserrat({
	subsets: ["latin"],
	variable: "--montserrat",
});

export const inter = Inter({
	subsets: ["latin"],
	variable: "--font-sans",
	display: "swap",
});
