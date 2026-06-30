import { Maximize2, Minimize2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useFullscreen } from "@/hooks/useFullscreen"

export function FullscreenToggle() {
  const { isFullscreen, toggleFullscreen } = useFullscreen()

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-xs"
      onClick={toggleFullscreen}
      aria-label={isFullscreen ? "יציאה ממסך מלא" : "מסך מלא"}
      className="fixed bottom-4 left-4 z-50 size-8 rounded-full border border-border/50 bg-background/70 text-muted-foreground shadow-lg backdrop-blur-sm hover:bg-primary/10 hover:text-primary"
    >
      {isFullscreen ? (
        <Minimize2 className="size-3.5" />
      ) : (
        <Maximize2 className="size-3.5" />
      )}
    </Button>
  )
}
