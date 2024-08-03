import { Routes, Route } from "react-router-dom"

import Footer from "./components/footer/Footer"
import Header from "./components/header/Header"
import Home from "./components/home/Home"
import Login from "./components/login/Login"
import Register from "./components/register/Register"
import SoftwareList from "./components/software-list/SoftwareList"
import SoftwareDetails from "./components/software-details/SoftwareDetails"
import SoftwareCreate from "./components/software-create/SoftwareCreate"

import { AuthContextProvider } from "./contexts/AuthContext"

function App() {
	return (
		<AuthContextProvider>
			<>
				<Header />

				<Routes>
					<Route path="/" element={<Home />} />
					<Route path="/softwares" element={<SoftwareList />} />
					<Route path="/softwares/:softwareId/details" element={<SoftwareDetails />} />
					<Route path="/softwares/create" element={<SoftwareCreate />} />
					<Route path="/login" element={<Login />} />
					<Route path="/register" element={<Register />} />
				</Routes>

				<Footer />

			</>
		</AuthContextProvider>
	)
}

export default App
