import React from "react";
import Login from "../../components/login/Login";

function LoginPage() {
  return <Login />;
}

(LoginPage as any).noChrome = true;

export default LoginPage;
