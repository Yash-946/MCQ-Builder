import type { Metadata } from "next";
import "./globals.css";


export const metadata: Metadata = {
  title: "MCQ Quiz Builder",
  description: "Generate multiple choice questions on any topic using AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
