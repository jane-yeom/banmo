'use client';
import { useFCM } from '@/hooks/useFCM';

export default function FCMProvider() {
  useFCM();
  return null;
}
