import { BrowserRouter, Route, Routes } from "react-router-dom"
import { SocketProvider } from "@/context/SocketContext"
import { CreateGamePage } from "@/pages/CreateGamePage"
import { GamePage } from "@/pages/GamePage"
import { HomePage } from "@/pages/HomePage"
import { JoinGamePage } from "@/pages/JoinGamePage"

function App() {
  return (
    <SocketProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/create" element={<CreateGamePage />} />
          <Route path="/join" element={<JoinGamePage />} />
          <Route path="/game/:pin" element={<GamePage />} />
        </Routes>
      </BrowserRouter>
    </SocketProvider>
  )
}

export default App
