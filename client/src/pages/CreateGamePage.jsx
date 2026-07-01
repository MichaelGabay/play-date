import { useCallback, useEffect, useRef, useState } from "react"
import { Link } from "react-router-dom"
import {
  ArrowRight,
  Copy,
  Crown,
  Loader2,
  User,
  Users,
} from "lucide-react"
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { GAME_MODES } from "@/data/mockData"
import { pickRandomQuestion, withTwoRandomOptions } from "@/data/questions"
import { useSocket } from "@/context/SocketContext"
import { useNewQuestionNavigation } from "@/hooks/useNewQuestionNavigation"

export function CreateGamePage() {
  const { socket, isConnected } = useSocket()
  const [playerName, setPlayerName] = useState("")
  const [selectedMode, setSelectedMode] = useState(GAME_MODES[0].id)
  const [roomPin, setRoomPin] = useState("")
  const [isCreatingRoom, setIsCreatingRoom] = useState(false)
  const [createError, setCreateError] = useState("")
  const [guestName, setGuestName] = useState(null)
  const [copied, setCopied] = useState(false)
  const [askedQuestionIds, setAskedQuestionIds] = useState([])
  const [startError, setStartError] = useState("")
  const [nameError, setNameError] = useState("")
  const hasCreatedRoom = useRef(false)

  const trimmedName = playerName.trim()
  const hasValidName = trimmedName.length > 0
  const partnerJoined = guestName !== null

  const getGameSessionState = useCallback(
    () => ({
      isHost: true,
      gameMode: selectedMode,
      askedQuestionIds,
      hostName: trimmedName,
      guestName: guestName ?? "",
    }),
    [selectedMode, askedQuestionIds, trimmedName, guestName]
  )

  useNewQuestionNavigation(roomPin || undefined, getGameSessionState)

  const lobbyPlayers = [
    {
      id: "host",
      name: hasValidName ? trimmedName : "הזינ/י שם",
      isHost: true,
      isReady: hasValidName,
    },
    {
      id: "guest",
      name: partnerJoined ? guestName : "ממתין/ה לשותף/ה...",
      isHost: false,
      isReady: partnerJoined,
    },
  ]

  useEffect(() => {
    const onRoomCreated = ({ pin }) => {
      setRoomPin(pin)
      setIsCreatingRoom(false)
      setCreateError("")
      setNameError("")
    }

    const onCreateError = ({ message }) => {
      setCreateError(message || "לא ניתן ליצור חדר")
      setIsCreatingRoom(false)
      hasCreatedRoom.current = false
    }

    const onPlayerJoined = ({ guestName: joinedGuestName }) => {
      setGuestName(joinedGuestName)
    }

    const onPlayerLeft = () => {
      setGuestName(null)
    }

    const onRoomClosed = () => {
      setCreateError("החדר נסגר")
      setRoomPin("")
      hasCreatedRoom.current = false
      setIsCreatingRoom(true)
    }

    const createRoom = () => {
      if (!trimmedName) {
        setNameError("יש להזין שם לפני יצירת החדר")
        setIsCreatingRoom(false)
        return
      }

      if (!hasCreatedRoom.current) {
        hasCreatedRoom.current = true
        setIsCreatingRoom(true)
      }

      setCreateError("")
      setNameError("")
      socket.emit("createRoom", {
        playerName: trimmedName,
        gameMode: selectedMode,
      })
    }

    const onQuestionError = ({ message }) => {
      setStartError(message || "לא ניתן לשלוח שאלה")
    }

    socket.on("roomCreated", onRoomCreated)
    socket.on("createError", onCreateError)
    socket.on("playerJoined", onPlayerJoined)
    socket.on("playerLeft", onPlayerLeft)
    socket.on("roomClosed", onRoomClosed)
    socket.on("questionError", onQuestionError)

    if (!trimmedName) {
      setIsCreatingRoom(false)
      return
    }

    if (socket.connected) {
      createRoom()
    } else {
      socket.on("connect", createRoom)
    }

    return () => {
      socket.off("roomCreated", onRoomCreated)
      socket.off("createError", onCreateError)
      socket.off("playerJoined", onPlayerJoined)
      socket.off("playerLeft", onPlayerLeft)
      socket.off("roomClosed", onRoomClosed)
      socket.off("questionError", onQuestionError)
      socket.off("connect", createRoom)
    }
  }, [socket, trimmedName, selectedMode])

  const handleCopyPin = useCallback(() => {
    if (!roomPin) return
    navigator.clipboard.writeText(roomPin).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [roomPin])

  const handleStartGame = useCallback(() => {
    if (!hasValidName) {
      setNameError("יש להזין שם לפני תחילת המשחק")
      return
    }

    if (!partnerJoined || !roomPin) return

    setStartError("")
    const picked = pickRandomQuestion(selectedMode, askedQuestionIds)

    if (!picked) {
      setStartError("אין עוד שאלות זמינות במצב זה")
      return
    }

    const question = withTwoRandomOptions(picked)

    setAskedQuestionIds((prev) => [...prev, question.id])
    socket.emit("sendQuestion", { pin: roomPin, question })
  }, [hasValidName, partnerJoined, roomPin, selectedMode, askedQuestionIds, socket])

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
          <h1 className="text-lg font-semibold">צור משחק</h1>
          <p className="text-xs text-muted-foreground">הגדר את החדר והמתן לשותף/ה</p>
        </div>
      </header>

      <main className="min-h-0 flex-1 overflow-y-auto">
        <div className="flex flex-col gap-5 px-4 py-5 pb-24">
          {!isConnected && (
            <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
              מתחבר לשרת...
            </p>
          )}

          {createError && (
            <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {createError}
            </p>
          )}

          {startError && (
            <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {startError}
            </p>
          )}

          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-base">פרטי השחקן</CardTitle>
              <CardDescription>איך השותף/ה יזהו אותך בלובי?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="player-name">
                  שם <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="player-name"
                  placeholder="הכנס/י את שמך"
                  value={playerName}
                  onChange={(e) => {
                    setPlayerName(e.target.value)
                    setNameError("")
                  }}
                  required
                  className="h-11 rounded-xl bg-background/50"
                />
                {nameError && (
                  <p className="text-xs text-destructive">{nameError}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>קוד חדר (PIN)</Label>
                <div className="flex items-center gap-2">
                  <div
                    dir="ltr"
                    className="flex flex-1 items-center justify-center gap-1 rounded-xl border border-primary/30 bg-primary/5 py-3 font-mono text-2xl font-bold tracking-[0.3em] text-primary"
                  >
                    {!hasValidName ? (
                      <span className="text-sm font-sans tracking-normal text-muted-foreground">
                        הזינ/י שם תחילה
                      </span>
                    ) : isCreatingRoom ? (
                      <Loader2 className="size-6 animate-spin" />
                    ) : (
                      roomPin
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleCopyPin}
                    disabled={!roomPin}
                    aria-label="העתק קוד"
                    className="size-11 shrink-0 rounded-xl"
                  >
                    <Copy className="size-4" />
                  </Button>
                </div>
                {copied && (
                  <p className="text-xs text-primary">הקוד הועתק!</p>
                )}
                <p className="text-xs text-muted-foreground">
                  שתף/י את הקוד עם השותף/ה שלך
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-base">מצב משחק</CardTitle>
              <CardDescription>בחר/י את סגנון השאלות</CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={selectedMode}
                onValueChange={setSelectedMode}
                className="gap-3"
              >
                {GAME_MODES.map((mode) => (
                  <label
                    key={mode.id}
                    htmlFor={mode.id}
                    className={cn(
                      "flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors",
                      selectedMode === mode.id
                        ? "border-primary/50 bg-primary/5"
                        : "border-border/50 bg-background/30 hover:border-border"
                    )}
                  >
                    <RadioGroupItem value={mode.id} id={mode.id} className="mt-0.5" />
                    <div className="flex flex-1 flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{mode.emoji}</span>
                        <span className="font-medium">{mode.label}</span>
                        <Badge variant="secondary" className="ms-auto text-xs">
                          {mode.questionCount} שאלות
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {mode.description}
                      </p>
                    </div>
                  </label>
                ))}
              </RadioGroup>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">לובי</CardTitle>
                  <CardDescription>שחקנים בחדר</CardDescription>
                </div>
                <Badge variant="outline" className="gap-1">
                  <Users className="size-3" />
                  {partnerJoined ? 2 : 1}/2
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {lobbyPlayers.map((player, index) => (
                <div key={player.id}>
                  <div className="flex items-center gap-3 rounded-xl bg-background/40 px-3 py-3">
                    <div
                      className={cn(
                        "flex size-10 items-center justify-center rounded-full",
                        player.isHost
                          ? "bg-primary/20 text-primary"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {player.isHost ? (
                        <Crown className="size-4" />
                      ) : (
                        <User className="size-4" />
                      )}
                    </div>
                    <div className="flex flex-1 flex-col">
                      <span className="text-sm font-medium">
                        {player.name || "שחקן/ית"}
                      </span>
                      {player.isHost && (
                        <span className="text-xs text-muted-foreground">מארח/ת</span>
                      )}
                    </div>
                    {player.isReady ? (
                      <Badge className="bg-primary/20 text-primary hover:bg-primary/20">
                        מוכן/ה
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="gap-1">
                        <Loader2 className="size-3 animate-spin" />
                        ממתין/ה
                      </Badge>
                    )}
                  </div>
                  {index < lobbyPlayers.length - 1 && (
                    <Separator className="my-2 opacity-50" />
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </main>

      <footer className="border-t border-border/50 bg-background/80 px-4 py-4 backdrop-blur-sm">
        <Button
          disabled={!hasValidName || !partnerJoined || !roomPin}
          size="lg"
          onClick={handleStartGame}
          className={cn(
            "h-12 w-full rounded-xl bg-gradient-to-l from-primary to-accent text-base font-semibold",
            (!hasValidName || !partnerJoined) && "opacity-60"
          )}
        >
          {!hasValidName
            ? "הזינ/י שם תחילה"
            : partnerJoined
              ? "התחל משחק"
              : "ממתין לשותף/ה..."}
        </Button>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          {!hasValidName
            ? "יש להזין שם לפני יצירת החדר והתחלת המשחק"
            : partnerJoined
              ? "לחץ/י להתחיל — שאלה אקראית תישלח לשני השחקנים"
              : "המשחק יתחיל כששני השחקנים יהיו בחדר"}
        </p>
      </footer>
    </MobileLayout>
  )
}
