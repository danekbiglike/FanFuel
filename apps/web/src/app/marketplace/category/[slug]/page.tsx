"use client";
import { useParams } from "next/navigation";
import { MarketplaceExperience } from "../../../../components/marketplace-experience";
export default function MarketplaceCategoryPage() {
  const { slug } = useParams<{ slug: string }>();
  return <MarketplaceExperience catalog categorySlug={slug} />;
}
