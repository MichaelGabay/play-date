import { Link } from "react-router-dom"
import { Heart, Plus, Users } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { MobileLayout } from "@/components/MobileLayout"
import { cn } from "@/lib/utils"

export function HomePage() {
  return (
    <MobileLayout>
      <main className="flex flex-1 flex-col items-center justify-center gap-10 px-6 pb-16 pt-8">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-primary/30 blur-2xl" />
            <div className="relative flex size-20 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/25">
              <Heart className="size-10 fill-primary-foreground/20 text-primary-foreground" />
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="bg-gradient-to-l from-primary via-accent to-primary bg-clip-text text-4xl font-bold tracking-tight text-transparent">
              Play Date
            </h1>
            <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
              משחק דייטים לזוגות — ענו על שאלות, גלו התאמות, והכירו אחד את השני לעומק
            </p>
          </div>
        </div>

        <div className="flex w-full max-w-xs flex-col gap-3">
          <Link
            to="/create"
            className={cn(
              buttonVariants({ size: "lg" }),
              "h-12 w-full rounded-xl bg-gradient-to-l from-primary to-accent text-base font-semibold shadow-lg shadow-primary/20 hover:opacity-90"
            )}
          >
            <Plus data-icon="inline-start" />
            צור משחק חדש
          </Link>

          <Link
            to="/join"
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "h-12 w-full rounded-xl border-border/60 bg-card/50 text-base backdrop-blur-sm"
            )}
          >
            <Users data-icon="inline-start" />
            הצטרף למשחק
          </Link>
        </div>

        <p className="text-xs text-muted-foreground/70">
          300 שאלות · 3 מצבי משחק · 2 שחקנים
        </p>
      </main>
    </MobileLayout>
  )
}
