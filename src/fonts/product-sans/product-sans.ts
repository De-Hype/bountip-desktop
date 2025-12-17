import localFont from "next/font/local";

export const productSans = localFont({
  src: [
    {
      path: "./ProductSans-Black.ttf",
      weight: "900",
      style: "normal",
    },
    {
      path: "./ProductSans-BlackItalic.ttf",
      weight: "900",
      style: "italic",
    },
    {
      path: "./ProductSans-Bold.ttf",
      weight: "700",
      style: "normal",
    },
    {
      path: "./ProductSans-BoldItalic.ttf",
      weight: "700",
      style: "italic",
    },
    {
      path: "./ProductSans-Italic.ttf",
      weight: "400",
      style: "italic",
    },
    {
      path: "./ProductSans-Light.ttf",
      weight: "300",
      style: "normal",
    },
    {
      path: "./ProductSans-LightItalic.ttf",
      weight: "300",
      style: "italic",
    },
    {
      path: "./ProductSans-Medium.ttf",
      weight: "500",
      style: "normal",
    },
    {
      path: "./ProductSans-MediumItalic.ttf",
      weight: "500",
      style: "italic",
    },
    {
      path: "./ProductSans-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "./ProductSans-Thin.ttf",
      weight: "100",
      style: "normal",
    },
    {
      path: "./ProductSans-ThinItalic.ttf",
      weight: "100",
      style: "italic",
    },
  ],
  variable: "--font-product-sans",
  display: "swap",
});
