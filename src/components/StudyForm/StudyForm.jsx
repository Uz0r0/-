import { useState, useEffect } from "react";
import axios from "axios";
import style from "../StudyForm/StudyForm.module.css";
import SelectBox from "../SelectBox/SelectBox";
import Button from "../Button/Button";
import TextArea from "../TextArea/TextArea";
import ChatBox from "../ChatBox/ChatBox";
import ChatHistoryPanel from "../ChatHistoryPanel/ChatHistoryPanel";
import Header from "../../components/Header/Header";

export default function StudyForm() {
  const [mode, setMode] = useState("ask"); 

  const [askData, setAskData] = useState({
    language: "Русский",
    typeOfResponse: "Полный",
    responseMode: "",
    prompt: "",
  });
  const [checkAnswerData, setCheckAnswerData] = useState({
    userQuestion: "",
    userAnswer: "",
    language: "Русский",
  });
  const [testUserData, setTestUserData] = useState({
    questionsTopic: "",
    language: "Русский",
    questionsNum: "",
    difficulty: "",
  });

  const [messages, setMessages] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [sessions, setSessions] = useState([]);
  const token = localStorage.getItem("access_token");

  useEffect(() => {
    axios
      .get("http://localhost:8080/api/chat/sessions", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setSessions(res.data))
      .catch((err) => console.error("Ошибка при получении сессий", err));
  }, [token]);

  const handleSelectSession = async (sessionId) => {
    setCurrentSessionId(sessionId);

    try {
      const res = await axios.get(`http://localhost:8080/api/chat/history/${sessionId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const history = res.data.map((msg) => ({
        role: msg.role,
        text: msg.content,
      }));

      setMessages(history);
    } catch (err) {
      console.error("Ошибка при загрузке истории", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      let sessionId = currentSessionId;

     if (!sessionId) {
        const sessionRes = await axios.post(
          "http://localhost:8080/api/chat/startSession",
          { title: askData.prompt.slice(0, 30) || "Новая сессия" },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        sessionId = sessionRes.data;

        const newSession = {
          id: sessionId,
          title: askData.prompt.slice(0, 30) || "Новая сессия"
        };

        setCurrentSessionId(sessionId);

        // Обновляем список сессий
        setSessions((prev) => [...prev, newSession]);

        // Ждём, пока новая сессия появится и сразу загружаем её историю
        await axios.get(`http://localhost:8080/api/chat/history/${sessionId}`, {
          headers: { Authorization: `Bearer ${token}` },
        }).then((res) => {
          const history = res.data.map((msg) => ({
            role: msg.role,
            text: msg.content,
          }));
          setMessages(history);
        });
      }

      let dto = {};
      let endpoint = "";

      if (mode === "ask") {
        endpoint = "/api/chat/ask";
        dto = {
          language: askData.language,
          typeOfResponse: askData.typeOfResponse,
          responseMode: askData.responseMode,
          prompt: askData.prompt,
          sessionId,
        };
        setMessages((prev) => [...prev, { role: "user", text: askData.prompt }]);
        setAskData((prev) => ({ ...prev, prompt: "" }));
      } else if (mode === "checkAnswer") {
        endpoint = "/api/chat/checkAnswer";
        dto = {
          userQuestion: checkAnswerData.userQuestion,
          userAnswer: checkAnswerData.userAnswer,
          language: checkAnswerData.language,
          sessionId,
        };
        setMessages((prev) => [
          ...prev,
          { role: "user", text: `Вопрос: ${checkAnswerData.userQuestion}\nОтвет: ${checkAnswerData.userAnswer}` },
        ]);
        setCheckAnswerData((prev) => ({ ...prev, userQuestion: "", userAnswer: "" }));
      } else if (mode === "testUser") {
        endpoint = "/api/chat/testUser";
        dto = {
          questionsTopic: testUserData.questionsTopic,
          language: testUserData.language,
          questionsNum: testUserData.questionsNum,
          difficulty: testUserData.difficulty,
          sessionId,
        };
        setMessages((prev) => [
          ...prev,
          {
            role: "user",
            text: `Тема: ${testUserData.questionsTopic}, Кол-во: ${testUserData.questionsNum}, Сложность: ${testUserData.difficulty}`,
          },
        ]);
        setTestUserData({ questionsTopic: "", language: "Русский", questionsNum: "", difficulty: "" });
      } else {
        alert("Выберите режим");
        return;
      }

      const res = await axios.post(`http://localhost:8080${endpoint}`, dto, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      setMessages((prev) => [...prev, { role: "ai", text: res.data }]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        { role: "ai", text: "Ошибка при отправке запроса." },
      ]);
    }
  };

  const handleMakeSimplier = async () => {
  if (!currentSessionId) {
    alert("Нет активной сессии. Сначала отправьте вопрос.");
    return;
  }

  try {
    const res = await axios.post(
      "http://localhost:8080/api/chat/makeSimplier",
      { sessionId: currentSessionId },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    setMessages((prev) => [...prev, { role: "ai", text: res.data }]);
  } catch (err) {
    console.error("Ошибка при упрощении ответа:", err);
    setMessages((prev) => [
      ...prev,
      { role: "ai", text: "Ошибка при упрощении ответа." },
    ]);
  }
};

  return (
    <div>
      <div className={style.pageContainer}>
        <div className={style.dflex}>
          <ChatHistoryPanel sessions={sessions} onSelect={handleSelectSession} currentSessionId={currentSessionId}/>
          <div className={style.container}>
            <ChatBox messages={messages} />
            <form onSubmit={handleSubmit}>
              <div className={style.askBlock}>
                <div>
                  <SelectBox
                    label="Режим"
                    options={[
                      { label: "Ask", value: "ask" },
                      { label: "Check Answer", value: "checkAnswer" },
                      { label: "Test User", value: "testUser" },
                    ]}
                    value={mode}
                    onChange={setMode}
                  />

                  <div className={style.lspacing}></div>

                  {mode === "ask" && (
                    <>
                      <div className={style.selectBlock}>
                        <div>
                          <SelectBox
                            label="Язык"
                            options={["Русский", "Кыргызский"]}
                            value={askData.language}
                            onChange={(val) => setAskData({ ...askData, language: val })}
                            className = {style.SelectBox}
                          />
                        </div>
                        <div>
                          <SelectBox
                            label="Тип запроса"
                            options={["Полный", "Краткий"]}
                            value={askData.typeOfResponse}
                            onChange={(val) => setAskData({ ...askData, typeOfResponse: val })}
                            className = {style.SelectBox}
                          />
                        </div>
                        <div>
                          <SelectBox
                            label="Режим ответа"
                            options={["Подготовка к экзамену", "Объяснение темы", "Освежить память"]}
                            value={askData.responseMode}
                            onChange={(val) => setAskData({ ...askData, responseMode: val })}
                            className = {style.SelectBox}
                          />
                        </div>
                         <Button
                          text="Сделать проще"
                          type="button"
                          onClick={handleMakeSimplier}
                        />
                      </div>
                      <div className={style.spacing}></div>
                      <TextArea
                        placeholder="Введите вопрос..."
                        value={askData.prompt}
                        onChange={(e) => setAskData({ ...askData, prompt: e.target.value })}
                        rows = {3}
                      />
                    </>
                  )}

                  {mode === "checkAnswer" && (
                    <>
                      <SelectBox
                        label="Язык"
                        options={["Русский", "Кыргызский"]}
                        value={checkAnswerData.language}
                        onChange={(val) => setCheckAnswerData({ ...checkAnswerData, language: val })}
                      />
                      <div className={style.lspacing}></div>
                      <div>
                        <TextArea
                          placeholder="Вопрос пользователя"
                          value={checkAnswerData.userQuestion}
                          onChange={(e) => setCheckAnswerData({ ...checkAnswerData, userQuestion: e.target.value })}
                          rows={2}
                        />
                        <TextArea
                          placeholder="Ответ пользователя"
                          value={checkAnswerData.userAnswer}
                          onChange={(e) => setCheckAnswerData({ ...checkAnswerData, userAnswer: e.target.value })}
                          rows={2}
                        />
                      </div>
                    </>
                  )}

                  {mode === "testUser" && (
                    <>
                      <div className={style.selectBlock}>
                        <SelectBox
                          label="Язык"
                          options={["Русский", "Кыргызский"]}
                          value={testUserData.language}
                          onChange={(val) => setTestUserData({ ...testUserData, language: val })}
                        />
                         <SelectBox
                          label="Сложность"
                          options={["Легко", "Средне", "Сложно"]}
                          value={testUserData.difficulty}
                          onChange={(val) => setTestUserData({ ...testUserData, difficulty: val })}
                        />
                        <div className={style.numberInputWrapper}>
                          <label className={style.label}><p>Количество вопросов</p></label>
                          <input
                            type="number"
                            min="1"
                            max="100"
                            value={testUserData.questionsNum}
                            onChange={(e) =>
                              setTestUserData({ ...testUserData, questionsNum: e.target.value })
                            }
                            className={style.numberInput}
                            placeholder="Введите число"
                          />
                        </div>
                      </div>
                      <div className={style.lspacing}></div>
                      <div className={style.lspacing}></div>
                      <div>
                        <TextArea
                          placeholder="Тема вопросов"
                          value={testUserData.questionsTopic}
                          onChange={(e) => setTestUserData({ ...testUserData, questionsTopic: e.target.value })}
                          rows={3}
                        />
                      </div>
                      
                     
                    </>
                  )}
                </div>
                <Button text="Отправить" type="submit" />
              </div>
            </form>
          </div>
          <div>
            <Header />
          </div>
        </div>
      </div>
    </div>
  );
}

