import CertificateVerifier from "@/components/shared/CertificateVerifier";

export const metadata = {
  title: "Verify Certificate · Internify",
  description: "Verify the authenticity of an Internify certificate.",
};

export default async function VerifyCertificatePage({
  params,
}: {
  params: Promise<{ certificateId: string }>;
}) {
  const { certificateId } = await params;
  return (
    <CertificateVerifier certificateId={decodeURIComponent(certificateId)} />
  );
}
