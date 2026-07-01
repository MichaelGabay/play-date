import { useEffect } from "react"
import { Link, useLocation, useNavigate, useParams } from "react-router-dom"
import { AnimatePresence, motion } from "framer-motion"
import { BellRing, Heart, Loader2, LogOut, Sparkles, User } from "lucide-react"
import { MobileLayout } from "@/components/MobileLayout"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { useGameVoting } from "@/hooks/useGameVoting"

const questionEntrance = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
}

const optionStagger = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
}

const resultHeaderPop = {
  initial: { opacity: 0, scale: 0.75 },
  animate: { opacity: 1, scale: 1 },
  transition: { type: "spring", stiffness: 420, damping: 18 },
}

const resultRowStagger = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
}

export function GamePage() {
  const { pin } = useParams()
  const location = useLocation()
  const navigate = useNavigate()

  const {
    question: initialQuestion,
    isHost = false,
    gameMode = "",
    askedQuestionIds = [],
    hostName = "",
    guestName = "",
  } = location.state ?? {}

  useEffect(() => {
    if (!initialQuestion) {
      navigate("/", { replace: true })
    }
  }, [initialQuestion, navigate])

  const {
    question,
    selectedAnswer,
    hasVoted,
    partnerHasVoted,
    results,
    nextQuestionError,
    partnerDisconnected,
    submitVote,
    handleNextQuestion,
    leaveGame,
    isHost: isRoomHost,
  } = useGameVoting({
    pin,
    question: initialQuestion,
    isHost,
    gameMode,
    askedQuestionIds,
    hostName,
    guestName,
  })

  const handleLeaveGame = () => {
    leaveGame()
    navigate("/", { replace: true })
  }

  const handlePartnerDisconnectedClose = () => {
    navigate("/", { replace: true })
  }

  if (!initialQuestion) {
    return null
  }

  const options = question?.options ?? []
  const showPartnerBanner = partnerHasVoted && !hasVoted && !results
  const isWaitingForPartner = hasVoted && !results
  const isResultsPhase = Boolean(results)

  return (
    <MobileLayout>
      <header className="border-b border-border/50 px-4 pb-3 pt-4">
        <div className="flex items-center justify-between gap-3">
          <Link
            to="/"
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent shadow-md shadow-primary/25 transition-opacity hover:opacity-90"
            aria-label="חזרה לדף הבית"
          >
            <Heart className="size-4 fill-primary-foreground/20 text-primary-foreground" />
          </Link>
          <h1 className="bg-gradient-to-l from-primary via-accent to-primary bg-clip-text text-lg font-bold tracking-tight text-transparent">
            Play Date
          </h1>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={handleLeaveGame}
            className="shrink-0 text-muted-foreground hover:text-destructive"
            aria-label="עזיבת המשחק"
          >
            <LogOut className="size-4" />
          </Button>
        </div>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          {isResultsPhase
            ? "תוצאות ההצבעה"
            : hasVoted
              ? "ממתין/ה לשותף/ה..."
              : "בחר/י את התשובה שלך"}
        </p>
      </header>

      <main className="min-h-0 flex-1 overflow-y-auto">
        <div className="flex h-full flex-col gap-6 px-4 py-6 pb-24">
          <AnimatePresence mode="wait">
            {showPartnerBanner && (
              <motion.div
                key="partner-banner"
                initial={{ opacity: 0, y: -12, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3 }}
              >
                <Alert className="border-accent/50 bg-accent/15 text-start shadow-lg shadow-accent/10">
                  <BellRing className="size-4 text-accent" />
                  <AlertTitle className="text-accent">
                    הצד השני בחר תשובה!
                  </AlertTitle>
                  <AlertDescription className="text-foreground/90">
                    הצד השני בחר תשובה, תורך!
                  </AlertDescription>
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>

          {nextQuestionError && (
            <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {nextQuestionError}
            </p>
          )}

          <AnimatePresence mode="wait">
            {!isResultsPhase ? (
              <motion.div
                key={`question-${question?.id ?? "current"}`}
                className="flex flex-1 flex-col gap-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25 }}
              >
                <motion.div {...questionEntrance}>
                  <Card className="border-primary/20 bg-gradient-to-b from-primary/10 to-card/80 backdrop-blur-sm">
                    <CardHeader className="text-center">
                      <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-primary/20">
                        <Sparkles className="size-5 text-primary" />
                      </div>
                      <CardDescription>השאלה שלכם</CardDescription>
                      <CardTitle className="text-xl leading-relaxed">
                        {question.question}
                      </CardTitle>
                    </CardHeader>
                  </Card>
                </motion.div>

                <div className="flex flex-1 flex-col gap-3">
                  {options.map((option, index) => {
                    const isSelected = selectedAnswer === option
                    const isDisabled = hasVoted || isResultsPhase

                    return (
                      <motion.div
                        key={`${question?.id ?? "q"}-${index}`}
                        {...optionStagger}
                        transition={{
                          duration: 0.35,
                          delay: 0.08 + index * 0.07,
                          ease: [0.22, 1, 0.36, 1],
                        }}
                      >
                        <Button
                          type="button"
                          variant="outline"
                          disabled={isDisabled}
                          onClick={() => submitVote(option)}
                          className={cn(
                            "h-auto min-h-16 w-full whitespace-normal rounded-2xl border-border/60 bg-card/80 px-5 py-4 text-base font-medium leading-snug",
                            "transition-all hover:border-primary/50 hover:bg-primary/10 hover:shadow-lg hover:shadow-primary/10",
                            "active:scale-[0.98]",
                            isSelected &&
                              "border-primary bg-primary/20 shadow-lg shadow-primary/20",
                            isDisabled && !isSelected && "opacity-50",
                          )}
                        >
                          {option}
                        </Button>
                      </motion.div>
                    )
                  })}
                </div>

                <AnimatePresence>
                  {isWaitingForPartner && (
                    <motion.div
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Card className="border-primary/30 bg-primary/5">
                        <CardContent className="flex items-center justify-center gap-2 py-4 text-sm text-primary">
                          <Loader2 className="size-4 animate-spin" />
                          ממתין/ה לשותף/ה...
                        </CardContent>
                      </Card>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ) : (
              <motion.div
                key="results"
                className="flex flex-1 flex-col gap-5"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <motion.div {...resultHeaderPop}>
                  <Card
                    className={cn(
                      "border-2 text-center backdrop-blur-sm",
                      results.isMatch
                        ? "border-primary/50 bg-gradient-to-b from-primary/20 to-card/80"
                        : "border-muted-foreground/30 bg-gradient-to-b from-muted/20 to-card/80",
                    )}
                  >
                    <CardHeader className="pb-2">
                      <CardTitle className="text-2xl font-bold leading-tight">
                        {results.isMatch
                          ? "זה התאמה! 🎉"
                          : "אופס, לא הפעם... 🤐"}
                      </CardTitle>
                      <CardDescription className="text-sm">
                        {question.question}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </motion.div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <ResultRow
                    name={results.hostName}
                    choice={results.hostChoice}
                    isMatch={results.isMatch}
                    index={0}
                  />
                  <ResultRow
                    name={results.guestName}
                    choice={results.guestChoice}
                    isMatch={results.isMatch}
                    index={1}
                  />
                </div>

                {isRoomHost && (
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35, duration: 0.35 }}
                    className="mt-auto"
                  >
                    <Button
                      size="lg"
                      onClick={handleNextQuestion}
                      className="h-12 w-full rounded-xl bg-gradient-to-l from-primary to-accent text-base font-semibold"
                    >
                      שאלה הבאה
                    </Button>
                  </motion.div>
                )}

                {!isRoomHost && (
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35, duration: 0.35 }}
                  >
                    <Card className="border-border/40 bg-background/40">
                      <CardContent className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground">
                        <Loader2 className="size-4 animate-spin" />
                        ממתין/ה למארח/ת לשאלה הבאה...
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <Dialog open={partnerDisconnected} onOpenChange={() => {}}>
        <DialogContent
          showCloseButton={false}
          className="border-destructive/30"
        >
          <DialogHeader>
            <DialogTitle>השותף/ה התנתק/ה</DialogTitle>
            <DialogDescription>
              השותף/ה שלך עזב/ה את המשחק. אפשר לחזור ללובי ולהתחיל מחדש.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="border-t-0 bg-transparent p-0 pt-2">
            <Button
              onClick={handlePartnerDisconnectedClose}
              className="w-full bg-gradient-to-l from-primary to-accent"
            >
              חזרה לדף הבית
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MobileLayout>
  )
}

function ResultRow({ name, choice, isMatch, index }) {
  return (
    <motion.div
      {...resultRowStagger}
      transition={{
        duration: 0.4,
        delay: 0.15 + index * 0.12,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      <Card className="h-full border-border/50 bg-card/80">
        <CardContent className="flex items-start gap-3 py-4">
          <div
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-full",
              isMatch
                ? "bg-primary/20 text-primary"
                : "bg-muted text-muted-foreground",
            )}
          >
            <User className="size-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground">{name}</p>
            <p className="text-sm font-medium leading-snug">{choice}</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
