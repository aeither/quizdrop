import { sdk } from "@farcaster/frame-sdk";
import { useEffect, useState } from "react";
import { useAccount, useConnect, useSignMessage } from "wagmi";

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<{ fid: number; displayName?: string; username?: string; pfpUrl?: string } | null>(
    null,
  );
  const [authToken, setAuthToken] = useState<string | null>(null);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        const context = await sdk.context;
        if (context.user) {
          setUser(context.user);
          const { token } = await sdk.quickAuth.getToken();
          setAuthToken(token);
        }
      } catch (error) {
        console.error("Failed to initialize auth:", error);
      } finally {
        setTimeout(() => {
          setIsLoading(false);
          sdk.actions.ready();
        }, 1500);
      }
    };

    initializeApp();
  }, []);

  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <>
      <div style={{ padding: "1rem", textAlign: "center" }}>
        <h1>🎯 QuizDrop</h1>
        <p>Interactive Quiz Mini App</p>
        {user ? <AuthenticatedView user={user} token={authToken} /> : <AuthenticationPrompt onAuth={setUser} />}
      </div>
      <ConnectMenu />
    </>
  );
}

function SplashScreen() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        color: "white",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div
        style={{
          fontSize: "3rem",
          fontWeight: "bold",
          marginBottom: "1rem",
          textAlign: "center",
        }}
      >
        🎯 QuizDrop
      </div>
      <div
        style={{
          fontSize: "1.2rem",
          marginBottom: "2rem",
          opacity: 0.9,
          textAlign: "center",
        }}
      >
        Interactive Quiz Experience
      </div>
      <div
        style={{
          width: "40px",
          height: "40px",
          border: "3px solid rgba(255,255,255,0.3)",
          borderTop: "3px solid white",
          borderRadius: "50%",
          animation: "spin 1s linear infinite",
        }}
      />
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

function ConnectMenu() {
  const { isConnected, address } = useAccount();
  const { connect, connectors } = useConnect();

  if (isConnected) {
    return (
      <>
        <div>Connected account:</div>
        <div>{address}</div>
        <SignButton />
      </>
    );
  }

  return (
    <button type="button" onClick={() => connect({ connector: connectors[0] })}>
      Connect
    </button>
  );
}

function SignButton() {
  const { signMessage, isPending, data, error } = useSignMessage();

  return (
    <>
      <button type="button" onClick={() => signMessage({ message: "hello world" })} disabled={isPending}>
        {isPending ? "Signing..." : "Sign message"}
      </button>
      {data && (
        <>
          <div>Signature</div>
          <div>{data}</div>
        </>
      )}
      {error && (
        <>
          <div>Error</div>
          <div>{error.message}</div>
        </>
      )}
    </>
  );
}

function AuthenticatedView({
  user,
  token,
}: { user: { fid: number; displayName?: string; username?: string; pfpUrl?: string }; token: string | null }) {
  const [isQuizActive, setIsQuizActive] = useState(false);

  if (isQuizActive) {
    return <QuizGame user={user} onExit={() => setIsQuizActive(false)} />;
  }

  return (
    <div style={{ margin: "2rem 0", padding: "1rem", backgroundColor: "#f0f8ff", borderRadius: "8px" }}>
      <h3>Welcome, {user.displayName || user.username}!</h3>
      <p>FID: {user.fid}</p>
      {user.pfpUrl && (
        <img
          src={user.pfpUrl}
          alt="Profile"
          style={{ width: "64px", height: "64px", borderRadius: "50%", margin: "1rem 0" }}
        />
      )}
      <div style={{ marginTop: "1rem" }}>
        <button
          type="button"
          style={{
            backgroundColor: "#667eea",
            color: "white",
            border: "none",
            padding: "0.75rem 1.5rem",
            borderRadius: "8px",
            fontSize: "1rem",
            cursor: "pointer",
          }}
          onClick={() => setIsQuizActive(true)}
        >
          Start Quiz 🚀
        </button>
      </div>
      {token && <p style={{ fontSize: "0.8rem", color: "#666", marginTop: "1rem" }}>Authenticated ✅</p>}
    </div>
  );
}

function AuthenticationPrompt({
  onAuth,
}: { onAuth: (user: { fid: number; displayName?: string; username?: string; pfpUrl?: string }) => void }) {
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const handleSignIn = async () => {
    setIsAuthenticating(true);
    try {
      await sdk.actions.signIn({
        nonce: crypto.randomUUID(),
        acceptAuthAddress: true,
      });

      const context = await sdk.context;
      if (context.user) {
        onAuth(context.user);
      }
    } catch (error) {
      console.error("Sign in failed:", error);
      alert("Sign in failed. Please try again.");
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <div style={{ margin: "2rem 0", padding: "2rem", backgroundColor: "#f9f9f9", borderRadius: "8px" }}>
      <h3>Welcome to QuizDrop!</h3>
      <p>Sign in with your Farcaster account to start playing quizzes and compete with friends.</p>
      <button
        type="button"
        onClick={handleSignIn}
        disabled={isAuthenticating}
        style={{
          backgroundColor: isAuthenticating ? "#ccc" : "#8b5cf6",
          color: "white",
          border: "none",
          padding: "0.75rem 1.5rem",
          borderRadius: "8px",
          fontSize: "1rem",
          cursor: isAuthenticating ? "not-allowed" : "pointer",
          marginTop: "1rem",
        }}
      >
        {isAuthenticating ? "Signing in..." : "Sign in with Farcaster"}
      </button>
    </div>
  );
}

interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

const SAMPLE_QUESTIONS: Question[] = [
  {
    id: 1,
    question: "What is the native token of the Base network?",
    options: ["ETH", "BASE", "USD", "BTC"],
    correctAnswer: 0,
    explanation: "Base uses ETH as its native token, just like Ethereum mainnet.",
  },
  {
    id: 2,
    question: "Which company developed the Base blockchain?",
    options: ["Meta", "Coinbase", "Google", "OpenSea"],
    correctAnswer: 1,
    explanation: "Base is an Ethereum Layer 2 blockchain developed by Coinbase.",
  },
  {
    id: 3,
    question: "What type of blockchain is Base?",
    options: ["Layer 1", "Layer 2", "Sidechain", "Private"],
    correctAnswer: 1,
    explanation: "Base is a Layer 2 blockchain built on top of Ethereum using Optimism's OP Stack.",
  },
  {
    id: 4,
    question: "What is the purpose of Farcaster?",
    options: ["DeFi protocol", "Social network", "NFT marketplace", "Gaming platform"],
    correctAnswer: 1,
    explanation: "Farcaster is a decentralized social network protocol built on Ethereum.",
  },
  {
    id: 5,
    question: "What does 'FID' stand for in Farcaster?",
    options: ["Farcaster ID", "Frame ID", "Function ID", "File ID"],
    correctAnswer: 0,
    explanation: "FID stands for Farcaster ID, which is a unique identifier for each user on the network.",
  },
];

function QuizGame({
  onExit,
  user,
}: {
  user: { fid: number; displayName?: string; username?: string; pfpUrl?: string };
  onExit: () => void;
}) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);

  const currentQuestion = SAMPLE_QUESTIONS[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === SAMPLE_QUESTIONS.length - 1;

  const handleAnswerSelect = (answerIndex: number) => {
    if (selectedAnswer !== null) return;

    setSelectedAnswer(answerIndex);
    setShowExplanation(true);

    if (answerIndex === currentQuestion.correctAnswer) {
      setScore(score + 1);
    }
  };

  const handleNext = () => {
    if (isLastQuestion) {
      setQuizCompleted(true);
    } else {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    }
  };

  const handleRestart = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setScore(0);
    setQuizCompleted(false);
  };

  if (quizCompleted) {
    const percentage = Math.round((score / SAMPLE_QUESTIONS.length) * 100);
    return (
      <div
        style={{
          margin: "2rem 0",
          padding: "2rem",
          backgroundColor: "#f0f8ff",
          borderRadius: "8px",
          textAlign: "center",
        }}
      >
        <h2>🎉 Quiz Completed!</h2>
        <div style={{ fontSize: "3rem", margin: "1rem 0" }}>
          {percentage >= 80 ? "🏆" : percentage >= 60 ? "🥈" : "📚"}
        </div>
        <h3>
          Your Score: {score}/{SAMPLE_QUESTIONS.length}
        </h3>
        <p style={{ fontSize: "1.2rem", marginBottom: "2rem" }}>
          {percentage}% - {percentage >= 80 ? "Excellent!" : percentage >= 60 ? "Good job!" : "Keep learning!"}
        </p>

        <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={handleRestart}
            style={{
              backgroundColor: "#667eea",
              color: "white",
              border: "none",
              padding: "0.75rem 1.5rem",
              borderRadius: "8px",
              fontSize: "1rem",
              cursor: "pointer",
            }}
          >
            Play Again 🔄
          </button>
          <button
            type="button"
            onClick={onExit}
            style={{
              backgroundColor: "#6b7280",
              color: "white",
              border: "none",
              padding: "0.75rem 1.5rem",
              borderRadius: "8px",
              fontSize: "1rem",
              cursor: "pointer",
            }}
          >
            Exit Quiz
          </button>
        </div>
      </div>
    );
  }

  const progressPercent = ((currentQuestionIndex + 1) / SAMPLE_QUESTIONS.length) * 100;

  return (
    <div className="quiz-card">
      <div className="quiz-progress">
        <div className="quiz-progress-bar" style={{ width: `${progressPercent}%` }} />
      </div>
      <div className="quiz-question">{currentQuestion.question}</div>
      <div className="quiz-options">
        {currentQuestion.options.map((option, index) => {
          let btnClass = "quiz-option-btn";
          if (selectedAnswer !== null) {
            if (index === currentQuestion.correctAnswer) btnClass += " correct";
            else if (index === selectedAnswer) btnClass += " incorrect";
          } else if (index === selectedAnswer) btnClass += " selected";
          return (
            <button
              key={`option-${currentQuestion.id}-${index}`}
              type="button"
              className={btnClass}
              onClick={() => handleAnswerSelect(index)}
              disabled={selectedAnswer !== null}
            >
              {option}
            </button>
          );
        })}
      </div>
      <div className="quiz-slide-indicator">
        {currentQuestionIndex + 1} of {SAMPLE_QUESTIONS.length} Slides
      </div>
      {showExplanation && (
        <div style={{ margin: '1.5rem 0', color: '#0c4a6e', background: '#f0f9ff', border: '1px solid #0ea5e9', borderRadius: '8px', padding: '1rem' }}>
          <strong>Explanation:</strong> {currentQuestion.explanation}
        </div>
      )}
      {showExplanation && (
        <button
          type="button"
          className="quiz-submit-btn"
          onClick={handleNext}
        >
          {isLastQuestion ? "Finish Quiz" : "Next Question"}
        </button>
      )}
    </div>
  );
}

export default App;
