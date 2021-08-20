import './App.css';
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";
import NavBar from './components/views/NavBar/NavBar';
import LandingPage from './components/views/LandingPage/LandingPage';
import RegisterPage from './components/views/RegisterPage/RegisterPage';
import LoginPage from './components/views/LoginPage/LoginPage';
import RoomPage from './components/views/RoomPage/RoomPage';
import Auth from "./hoc/auth";

function App() {
  return (
    <div>
      <Router>
        <Switch>
          <Route exact path="/" component={Auth(LandingPage, null)} />
          <Route exact path="/login" component={Auth(LoginPage, false)} />
          <Route exact path="/register" component={Auth(RegisterPage, false)} />
          <Route path="/rooms/:roomName" component={Auth(RoomPage, true)} />
        </Switch>
      </Router>
    </div>
  );
}

export default App;
