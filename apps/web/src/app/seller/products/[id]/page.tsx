"use client";
import { useParams } from "next/navigation";
import { SellerProductWorkspace } from "../../../../components/seller-commerce-editor";
export default function Page() {
  const { id } = useParams<{ id: string }>();
  return <SellerProductWorkspace id={id} />;
}
