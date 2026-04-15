import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(date: Date | string): string {
  return new Date(date).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

export function getRunningTAT(dateOfOrder: Date | string): string {
  const diff = Date.now() - new Date(dateOfOrder).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (days > 0) return `${days}d ${hours}h ${mins}m`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

export function generateTransId(): string {
  const year = new Date().getFullYear();
  const rand = Math.floor(10000000 + Math.random() * 90000000);
  return `${rand}-${rand + Math.floor(Math.random() * 9999)}`;
}

export const STATUS_LABELS: Record<string, string> = {
  submitted: "Application Submitted",
  in_progress: "In Progress",
  pending_review: "Pending Review",
  additional_info: "Additional Info Required",
  completed: "Completed",
  closed: "Closed",
};

export const STATUS_COLORS: Record<string, string> = {
  submitted: "bg-surface-container-high text-on-surface-variant",
  in_progress: "bg-primary-fixed text-primary",
  pending_review: "bg-tertiary-fixed text-tertiary",
  additional_info: "bg-tertiary-fixed text-tertiary",
  completed: "bg-secondary-container text-secondary",
  closed: "bg-surface-container-high text-on-surface-variant",
};
