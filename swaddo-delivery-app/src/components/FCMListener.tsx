"use client";

import { useFCM } from "../hooks/useFCM";

export default function FCMListener() {
  useFCM();
  return null;
}
