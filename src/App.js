import { useEffect, useReducer } from "react";
import Header from "./Header";
import Loader from "./Loader";
import Error from "./Error";

const initialState = {
  questions: [],

  status: "",
  currQue: 0,
  ansId: null,
  isCrrtAns: false,
  crrtAns: false,
  points: 0,
  heighScore: 0,
  secondsRemaining: null,
};

function reducer(state, action) {
  switch (action.type) {
    case "loading":
      return { ...state, status: "loading" };
    case "ready":
      return { ...state, status: "ready", questions: action.payload };
    case "active":
      return {
        ...state,
        status: "active",
        secondsRemaining: state.questions?.length * 60,
      };
    case "error":
      return { ...state, status: "error" };
    case "ansSelected":
      const result =
        state.questions[state.currQue].correctOption === action.payload;
      return {
        ...state,
        ansId: action.payload,
        isCrrtAns: result,
        crrtAns: !result,
        points: result
          ? state.points + state.questions[state.currQue].points
          : state.points,
      };
    case "next":
      return {
        ...state,
        currQue: state.currQue + 1,
        status: state.currQue >= 14 ? "finish" : state.status,
        ansId: null,
        crrtAns: false,
        isCrrtAns: false,
        heighScore:
          state.heighScore < state.points ? state.points : state.heighScore,
      };
    case "restart":
      return {
        ...initialState,
        status: "ready",
        questions: state.questions,
        heighScore: state.heighScore,
      };
    case "finish":
      return {
        ...state,
        secondsRemaining: state.secondsRemaining - 1,
        status: state.secondsRemaining === 0 ? "finish" : state.status,
        heighScore:
          state.heighScore < state.points ? state.points : state.heighScore,
      };
    default:
      return "something went wrong done";
  }
}

function App() {
  const [
    {
      status,
      questions,
      currQue,
      ansId,
      isCrrtAns,
      crrtAns,
      points,
      heighScore,
      secondsRemaining,
    },
    dispatch,
  ] = useReducer(reducer, initialState);

  useEffect(function () {
    async function fetchQuestions() {
      try {
        dispatch({ type: "loading" });
        const res = await fetch("http://localhost:8000/questions");
        const data = await res.json();
        console.log(data);
        dispatch({ type: "ready", payload: data });
        if (!res.ok) throw new Error("Something went Wrong!");
      } catch (e) {
        dispatch({ type: "error" });
      }
    }
    fetchQuestions();
  }, []);

  return (
    <div className="app">
      <Header />
      <Main
        questions={questions}
        dispatch={dispatch}
        currQue={currQue}
        ansId={ansId}
        isCrrtAns={isCrrtAns}
        crrtAns={crrtAns}
        points={points}
        status={status}
        heighScore={heighScore}
        secondsRemaining={secondsRemaining}
      />
    </div>
  );
}

export default App;

function Main({
  currQue,
  questions,
  dispatch,
  isCrrtAns,
  ansId,
  crrtAns,
  points,
  status,
  heighScore,
  secondsRemaining,
}) {
  return (
    <main className="main">
      {status === "loading" && <Loader />}
      {status === "ready" && (
        <StarterScreen questions={questions} dispatch={dispatch} />
      )}
      {status === "active" && (
        <>
          <Progress
            questions={questions}
            currQue={currQue}
            ansId={ansId}
            points={points}
          />
          <Question
            question={questions[currQue]}
            dispatch={dispatch}
            key={questions[currQue].id}
            ansId={ansId}
            isCrrtAns={isCrrtAns}
            crrtAns={crrtAns}
            currQue={currQue}
            secondsRemaining={secondsRemaining}
          />
        </>
      )}
      {status === "finish" && (
        <Result
          dispatch={dispatch}
          questions={questions}
          points={points}
          heighScore={heighScore}
        />
      )}

      {status === "error" && <Error />}
    </main>
  );
}

function StarterScreen({ questions, dispatch }) {
  return (
    <div className="start">
      <h2>Welcome to The React Quiz</h2>

      <h4>{questions.length} questions to test your React mastery</h4>
      <button className="btn" onClick={() => dispatch({ type: "active" })}>
        Let's Start
      </button>
    </div>
  );
}

function Question({
  question,
  dispatch,
  isCrrtAns,
  ansId,
  crrtAns,
  currQue,
  secondsRemaining,
}) {
  const mins = Math.floor(secondsRemaining / 60)
    .toString()
    .padStart(2, "0");
  const secs = (secondsRemaining % 60).toString().padStart(2, "0");

  useEffect(
    function () {
      const time = setInterval(() => dispatch({ type: "finish" }), 1000);

      return () => clearInterval(time);
    },

    [dispatch]
  );
  return (
    <>
      {" "}
      <h3>{question.question}</h3>
      <div className="options">
        {question.options.map((op, i) => (
          <Option
            op={op}
            key={op}
            id={i}
            dispatch={dispatch}
            ansId={ansId}
            isCrrtAns={isCrrtAns}
            crrtAns={crrtAns}
            ExactAns={question.correctOption}
          />
        ))}
      </div>
      <button
        className="btn btn-ui"
        disabled={ansId === 0 ? false : !Boolean(ansId)}
        onClick={() => dispatch({ type: "next" })}
      >
        {ansId && currQue >= 14 ? "Finish Test" : "Next"}
      </button>
      <div className="timer">
        {mins}:{secs}
      </div>
    </>
  );
}

function Option({ op, id, dispatch, isCrrtAns, ansId, crrtAns, ExactAns }) {
  return (
    <button
      className={`btn btn-option ${ansId === id ? "answer" : ""} ${
        ansId === id && isCrrtAns ? "correct" : ""
      } ${ansId === id && !isCrrtAns ? "wrong" : ""} ${
        crrtAns && id === ExactAns ? "correct" : ""
      }`}
      disabled={ansId >= 0 && ansId !== null && ansId !== id}
      onClick={() => dispatch({ type: "ansSelected", payload: id })}
    >
      {op}
    </button>
  );
}

function Progress({ questions, currQue, points, ansId }) {
  const totalPoints = questions
    .map((que) => que.points)
    .reduce((acc, cur) => acc + cur, 0);
  return (
    <div className="progress">
      <progress
        max={questions.length}
        value={ansId ? currQue + 1 : currQue}
      ></progress>
      <p>
        {currQue + 1}/{questions.length}
      </p>
      <p>
        {points}/{totalPoints}
      </p>
    </div>
  );
}

function Result({ questions, points, dispatch, heighScore }) {
  const totalPoints = questions
    .map((que) => que.points)
    .reduce((acc, cur) => acc + cur, 0);

  return (
    <div>
      <p className="highscore">Your HeighScore : {heighScore}</p>
      <p className="result">
        Your Score : <span>{points}</span>/{totalPoints}
      </p>
      <button
        className="btn btn-ui"
        onClick={() => dispatch({ type: "restart" })}
      >
        Restart Quiz
      </button>
    </div>
  );
}
