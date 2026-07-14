import "./globals.css";

export const metadata = {
  title: "DeepAsk · Public data demo",
  description:
    "A short demonstration of adaptive public-data listening and collective pattern finding.",
  robots: {
    index: false,
    follow: false
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
