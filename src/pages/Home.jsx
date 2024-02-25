import { auth } from "../config/firebase.config";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";

export const Home = () => {
  const navigate = useNavigate();
  const logOut = async () => {
    try {
      await signOut(auth);
      navigate("/");
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div>
      <div>Home Page</div>
      <button onClick={logOut}>Logout</button>
    </div>
  );
};