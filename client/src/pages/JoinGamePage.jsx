import { useCallback, useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { ArrowRight, CheckCircle2, Loader2, LogIn } from "lucide-react"
import { MobileLayout } from "@/components/MobileLayout"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { useSocket } from "@/context/SocketContext"
import { useNewQuestionNavigation } from "@/hooks/useNewQuestionNavigation"

export function JoinGamePage() {
  const { socket, isConnected } = useSocket()
  const [pin, setPin] = useState("")
  const [playerName, setPlayerName] = useState("")
  const [isJoining, setIsJoining] = useState(false)
  const [joinError, setJoinError] = useState("")
  const [hasJoined, setHasJoined] = useState(false)
  const [lobbyInfo, setLobbyInfo] = useState(null)

  const handlePinChange = (e) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 6)
    setPin(value)
    setJoinError("")
  }

  const isValid = pin.length === 6 && playerName.trim().length > 0

  const getGameSessionState = useCallback(
    () => ({
      isHost: false,
      gameMode: lobbyInfo?.gameMode,
      hostName: lobbyInfo?.hostName,
      guestName: lobbyInfo?.guestName,
    }),
    [lobbyInfo]
  )

  useNewQuestionNavigation(hasJoined ? lobbyInfo?.pin : undefined, getGameSessionState)

  useEffect(() => {
    const onJoinSuccess = (data) => {
      setHasJoined(true)
      setIsJoining(false)
      setLobbyInfo(data)
    }

    const onJoinError = ({ message }) => {
      setJoinError(message)
      setIsJoining(false)
    }

    const onRoomClosed = () => {
      setHasJoined(false)
      setLobbyInfo(null)
      setJoinError("המארח/ת עזב/ה את החדר")
    }

    socket.on("joinSuccess", onJoinSuccess)
    socket.on("joinError", onJoinError)
    socket.on("roomClosed", onRoomClosed)

    return () => {
      socket.off("joinSuccess", onJoinSuccess)
      socket.off("joinError", onJoinError)
      socket.off("roomClosed", onRoomClosed)
    }
  }, [socket])

  const handleJoin = () => {
    if (!isValid || isJoining) return

    setIsJoining(true)
    setJoinError("")
    socket.emit("joinRoom", {
      pin,
      playerName: playerName.trim(),
    })
  }

  if (hasJoined && lobbyInfo) {
    return (
      <MobileLayout>
        <header className="flex items-center gap-3 border-b border-border/50 px-4 py-4">
          <Link
            to="/"
            className={cn(
              buttonVariants({ variant: "ghost", size: "icon-sm" }),
              "shrink-0"
            )}
            aria-label="חזרה לדף הבית"
          >
            <ArrowRight className="size-4" />
          </Link>
          <div>
            <h1 className="text-lg font-semibold">לובי</h1>
            <p className="text-xs text-muted-foreground">הצטרפת בהצלחה לחדר</p>
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto">
          <div className="flex flex-col justify-center gap-5 px-4 py-8 pb-24">
            <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
              <CardHeader className="text-center">
                <div className="mx-auto mb-2 flex size-14 items-center justify-center rounded-full bg-primary/20">
                  <CheckCircle2 className="size-7 text-primary" />
                </div>
                <CardTitle>את/ה בלובי!</CardTitle>
                <CardDescription>
                  ממתין/ה למארח/ת להתחיל את המשחק
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-xl bg-background/40 px-4 py-3 text-center">
                  <p className="text-xs text-muted-foreground">קוד חדר</p>
                  <p dir="ltr" className="font-mono text-2xl font-bold tracking-[0.3em] text-primary">
                    {lobbyInfo.pin}
                  </p>
                </div>

                <div className="flex items-center justify-between rounded-xl bg-background/40 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium">{lobbyInfo.hostName}</p>
                  </div>
                  <Badge className="bg-primary/20 text-primary hover:bg-primary/20">
                    מוכן/ה
                  </Badge>
                </div>

                <div className="flex items-center justify-between rounded-xl bg-background/40 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium">{lobbyInfo.guestName}</p>
                  </div>
                  <Badge className="bg-primary/20 text-primary hover:bg-primary/20">
                    מוכן/ה
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>

        <footer className="border-t border-border/50 bg-background/80 px-4 py-4 backdrop-blur-sm">
          <Button
            disabled
            size="lg"
            className="h-12 w-full rounded-xl bg-gradient-to-l from-primary to-accent text-base font-semibold opacity-60"
          >
            <Loader2 className="size-4 animate-spin" data-icon="inline-start" />
            ממתין/ה למארח/ת...
          </Button>
        </footer>
      </MobileLayout>
    )
  }

  return (
    <MobileLayout>
      <header className="flex items-center gap-3 border-b border-border/50 px-4 py-4">
        <Link
          to="/"
          className={cn(
            buttonVariants({ variant: "ghost", size: "icon-sm" }),
            "shrink-0"
          )}
          aria-label="חזרה לדף הבית"
        >
          <ArrowRight className="size-4" />
        </Link>
        <div>
          <h1 className="text-lg font-semibold">הצטרף למשחק</h1>
          <p className="text-xs text-muted-foreground">הכנס/י את קוד החדר שקיבלת</p>
        </div>
      </header>

      <main className="min-h-0 flex-1 overflow-y-auto">
        <div className="flex flex-col justify-center px-4 py-8 pb-24">
          {!isConnected && (
            <p className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
              מתחבר לשרת...
            </p>
          )}

          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader className="text-center">
              <div className="mx-auto mb-2 flex size-14 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-accent/20">
                <LogIn className="size-7 text-primary" />
              </div>
              <CardTitle>כניסה לחדר</CardTitle>
              <CardDescription>
                הזן/י את קוד ה-PIN בן 6 הספרות ואת שמך
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="room-pin">קוד חדר (PIN)</Label>
                <Input
                  id="room-pin"
                  dir="ltr"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="000000"
                  value={pin}
                  onChange={handlePinChange}
                  maxLength={6}
                  className="h-14 rounded-xl bg-background/50 text-center font-mono text-2xl tracking-[0.4em] placeholder:tracking-normal"
                />
                <p className="text-xs text-muted-foreground">
                  {pin.length}/6 ספרות
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="join-name">
                  שם <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="join-name"
                  placeholder="הכנס/י את שמך"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  required
                  className="h-11 rounded-xl bg-background/50"
                />
                {!playerName.trim() && (
                  <p className="text-xs text-muted-foreground">שדה חובה</p>
                )}
              </div>

              {joinError && (
                <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                  {joinError}
                </p>
              )}

              <Button
                disabled={!isValid || isJoining || !isConnected}
                size="lg"
                onClick={handleJoin}
                className={cn(
                  "h-12 w-full rounded-xl text-base font-semibold",
                  isValid && isConnected
                    ? "bg-gradient-to-l from-primary to-accent shadow-lg shadow-primary/20"
                    : "opacity-50"
                )}
              >
                {isJoining ? (
                  <>
                    <Loader2 className="size-4 animate-spin" data-icon="inline-start" />
                    מצטרף/ת...
                  </>
                ) : (
                  "הצטרף ללובי"
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </MobileLayout>
  )
}
