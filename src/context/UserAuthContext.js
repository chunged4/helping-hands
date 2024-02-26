import { createContext, useState } from "react";

const userAuthContext = createContext();

export function UserAuthContextProvider({ children }) {
  const [user, setUser] = useState(localStorage.getItem("user"));

  return (
    <userAuthContext.Provider value={{ user, setUser }}>
      {children}
    </userAuthContext.Provider>
  );
}
