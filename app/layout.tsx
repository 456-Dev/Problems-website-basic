import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Question The Day - Daily Interview Series",
  description: "Watch strangers answer random questions. A daily interview series by Question The Day.",
  keywords: ["interviews", "questions", "youtube shorts", "street interviews"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

