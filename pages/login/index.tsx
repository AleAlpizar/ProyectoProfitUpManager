import Login from "../../components/login/Login";

function LoginPage() {
  return <Login />
}

// remove layout
(LoginPage as any).getLayout = (page: React.ReactNode) => page;

export default LoginPage;
