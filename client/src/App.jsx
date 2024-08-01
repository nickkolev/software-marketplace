import { Routes, Route } from "react-router-dom"
import { useState } from "react"
import { AuthContext } from "./contexts/AuthContext.js"

import Footer from "./components/footer/Footer"
import Header from "./components/header/Header"
import Home from "./components/home/Home"
import Login from "./components/login/Login"
import Register from "./components/register/Register"
import SoftwareList from "./components/software-list/SoftwareList.jsx"
import SoftwareDetails from "./components/software-details/SoftwareDetails"

function App() {
	const [authState, setAuthState] = useState({});

	const changeAuthState = (state) => {

		localStorage.setItem('accessToken', state.accessToken);

		setAuthState(state);
	}

	const contextData = {
		userId: authState._id,
		email: authState.email,
		accessToken: authState.accessToken,
		isAuthenticated: !!authState.email,
		changeAuthState
	}

	return (
		<AuthContext.Provider value={contextData}>
			<>
				<Header />

				<Routes>
					<Route path="/" element={<Home />} />
					<Route path="/softwares" element={<SoftwareList />} />
					<Route path="/softwares/:softwareId/details" element={<SoftwareDetails />} />
					{/* <Route path="/upload" element={<Home />} /> */}
					<Route path="/login" element={<Login />} />
					<Route path="/register" element={<Register />} />
				</Routes>

				<Footer />

			</>
		</AuthContext.Provider>
	)
}

export default App
