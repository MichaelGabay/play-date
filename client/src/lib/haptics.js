function canVibrate() {
  return typeof navigator !== "undefined" && "vibrate" in navigator
}

export function hapticLight() {
  if (canVibrate()) {
    navigator.vibrate(50)
  }
}

export function hapticPartnerTurn() {
  if (canVibrate()) {
    navigator.vibrate([100, 50, 100])
  }
}

export function hapticSuccess() {
  if (canVibrate()) {
    navigator.vibrate(200)
  }
}
