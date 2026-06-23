import "./globals.css";

export const metadata = {
  title: "Paradogs · DeepAsk Live",
  description:
    "Yes, but no. Adaptive civic listening prototype for EU civic hackathon feedback."
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
