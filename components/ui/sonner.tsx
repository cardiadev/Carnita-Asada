"use client"

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast: "group toast group-[.toaster]:shadow-lg group-[.toaster]:border-border",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
          // Success (Verde como el screenshot)
          "--success-bg": "var(--success-bg-theme)",
          "--success-text": "var(--success-text-theme)",
          "--success-border": "var(--success-border-theme)",
          // Error (Rojo suave)
          "--error-bg": "var(--error-bg-theme)",
          "--error-text": "var(--error-text-theme)",
          "--error-border": "var(--error-border-theme)",
          // Warning (Ambar)
          "--warning-bg": "var(--warning-bg-theme)",
          "--warning-text": "var(--warning-text-theme)",
          "--warning-border": "var(--warning-border-theme)",
          // Info (Azul)
          "--info-bg": "var(--info-bg-theme)",
          "--info-text": "var(--info-text-theme)",
          "--info-border": "var(--info-border-theme)",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
