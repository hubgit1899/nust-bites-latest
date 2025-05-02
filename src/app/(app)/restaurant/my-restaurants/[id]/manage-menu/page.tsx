"use client";

import { useParams } from "next/navigation";

export default function ManageMenu() {
  const { id } = useParams();
  return <div>Manage menu for restaurant {id}</div>;
}
