import LoginPageClient from "@/components/auth/LoginPageClient";

interface PageProps {
  searchParams: Promise<{ error?: string }>;
}

export default async function LoginPage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;
  return <LoginPageClient searchParams={resolvedParams} />;
}
