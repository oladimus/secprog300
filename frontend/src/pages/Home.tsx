import React from "react"

import { useNavigate } from "react-router-dom"
const Home: React.FC = () => {
    const navigate = useNavigate()

    return (
        <div>
            <button
                className="toggle-button"
                onClick={() => navigate("/logout")}
            >
                Logout
            </button>
            <div>
                Home
            </div>
        </div>
    )

}

export default Home