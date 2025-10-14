import { ReactNode } from "react";

// Force dynamic rendering for all portal pages
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function PortalLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
