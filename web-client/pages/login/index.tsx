import Login from "../../components/login/Login";

function LoginPage() {
  return <Login />
}

(LoginPage as any).getLayout = (page: React.ReactNode) => page;

export default LoginPage;
