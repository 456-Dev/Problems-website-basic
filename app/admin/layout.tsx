import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Dashboard - Question The Day",
  description: "Manage your Question The Day website",
  robots: "noindex, nofollow", // Prevent search engines from indexing admin pages
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

