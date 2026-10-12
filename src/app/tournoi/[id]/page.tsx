"use client";

import { useParams } from "next/navigation";
import TournamentLive from "@/components/Tournois";

export default function TournoiPublicPage() {
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : (params.id as string);
  return <TournamentLive id={id} />;
}
