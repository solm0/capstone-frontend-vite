import { BrowserRouter, Routes, Route } from "react-router-dom"
import Login from "./pages/Login"
import Signup from "./pages/Signup"
import ResetPassword from "./pages/ResetPassword"
import ResetRequest from "./pages/ResetRequest"
import AuthLayout from "./components/AuthLayout"
import Playground from "./pages/Playground"
import History from "./pages/History"
import HomeLayout from "./components/HomeLayout"
import Dashboard from "./components/Dashboard"

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<HomeLayout />} >
          <Route path="/" element={<Dashboard />} />
          <Route path="/playground" element={<Playground />} />
          <Route path="/history" element={<History />} />
        </Route>

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