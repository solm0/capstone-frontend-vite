import { BrowserRouter, Routes, Route } from "react-router-dom"
import Login from "./pages/Login"
import Signup from "./pages/Signup"
import ResetPassword from "./pages/ResetPassword"
import ResetRequest from "./pages/ResetRequest"
import Home from "./pages/Home"
import AuthLayout from "./components/AuthLayout"

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />

        <Route element={<AuthLayout />} >
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/reset-request" element={<ResetRequest />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}