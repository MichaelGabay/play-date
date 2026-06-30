import { FullscreenToggle } from "@/components/FullscreenToggle"

export function MobileLayout({ children }) {
  return (
    <div className="relative mx-auto h-screen max-w-md overflow-hidden bg-background">
      <div className="flex h-full min-h-0 flex-col">{children}</div>
      <FullscreenToggle />
    </div>
  )
}
