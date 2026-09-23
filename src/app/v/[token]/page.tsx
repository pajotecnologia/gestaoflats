import AssinarVistoriaPublicPage from "@/app/assinar/vistoria/[token]/page";

export default function VistoriaShortLinkPage({ params }: { params: { token: string } }) {
  return <AssinarVistoriaPublicPage params={params} />;
}
