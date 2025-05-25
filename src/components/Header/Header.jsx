import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../AuthContext/AuthContext";
import styles from "../Header/Header.module.css";

function Header() {
  const navigate = useNavigate();
  const { isLoggedIn, logout } = useContext(AuthContext);

  return (
    <div className={styles.selectBlock}>
      <div className={styles.HeaderBlock}>
        {isLoggedIn ? (
          <>
            <div className={styles.center}>
              <p>{localStorage.getItem("username")}</p>
            </div>
            <button onClick={() => { logout(); navigate("/"); }} className={styles.btnStyle}>
              Выйти
            </button>
          </>
        ) : (
          <>
            <button onClick={() => navigate("/login")} className={styles.btnStyle}>
              Войти
            </button>
            <button onClick={() => navigate("/register")} className={styles.btnStyle}>
              Регистрация
            </button>
          </>
        )}
      </div>
    </div> 
  );
}

export default Header;