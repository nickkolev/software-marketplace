import { Routes, Route } from "react-router-dom"

import { AuthContextProvider } from "./contexts/AuthContext"

import Footer from "./components/footer/Footer"
import Header from "./components/header/Header"
import Home from "./components/home/Home"
import Login from "./components/login/Login"
import Register from "./components/register/Register"
import SoftwareList from "./components/software-list/SoftwareList"
import SoftwareDetails from "./components/software-details/SoftwareDetails"
import SoftwareCreate from "./components/software-create/SoftwareCreate"
import Logout from "./components/logout/Logout"
import SoftwareEdit from "./components/software-edit/SoftwareEdit"

function App() {
	return (
		<AuthContextProvider>
			<>
				<Header />

				<Routes>
					<Route path="/" element={<Home />} />
					<Route path="/login" element={<Login />} />
					<Route path="/register" element={<Register />} />
					<Route path="/logout" element={<Logout />} />
					<Route path="/softwares" element={<SoftwareList />} />
					<Route path="/softwares/:softwareId/details" element={<SoftwareDetails />} />
					<Route path="/softwares/:softwareId/edit" element={<SoftwareEdit />} />
					<Route path="/softwares/create" element={<SoftwareCreate />} />
				</Routes>

				<Footer />

			</>
		</AuthContextProvider>
	)
}

export default App
