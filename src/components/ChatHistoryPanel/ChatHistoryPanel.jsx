import { useEffect, useState } from "react";
import axios from "axios";
import styles from "./ChatHistoryPanel.module.css";

const ChatHistoryPanel = ({ onSelect, activeSessionId }) => {
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem("access_token");

    axios.get("http://localhost:8080/api/chat/sessions", {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => setSessions(res.data))
    .catch(err => console.error("Ошибка при получении сессий", err));
  }, []);

  return (
    <div className={styles.panel}>
      <h3>История</h3>
      <ul>
        {sessions.map((s) => (
          <li
            key={s.id}
            onClick={() => onSelect(s.id)}
            className={`${styles.sessionItem} ${activeSessionId === s.id ? styles.active : ""}`}
          >
            {s.title || `Чат #${s.id}`}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ChatHistoryPanel;
