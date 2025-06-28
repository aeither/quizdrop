import { sdk } from "@farcaster/frame-sdk";
import { useEffect, useState } from "react";
import { useAccount, useConnect, useSignMessage, useWalletClient, usePublicClient } from "wagmi";
import { createPublicClient, http, Address } from "viem";
import { base } from "viem/chains";
import { setApiKey, createCoin, DeployCurrency } from '@zoralabs/coins-sdk';

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
        setIsLoading(false);
        sdk.actions.ready();
      }
    };

    initializeApp();
  }, []);

  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <>
      <div style={{ textAlign: "center" }}>
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
  const [activeView, setActiveView] = useState<'home' | 'quiz' | 'create'>('home');
  const [createdQuizzes, setCreatedQuizzes] = useState<Array<{
    id: string;
    name: string;
    coinAddress: string;
    txHash: string;
    created: number;
  }>>([]);

  if (activeView === 'quiz') {
    return <QuizGame onExit={() => setActiveView('home')} user={user} />;
  }

  if (activeView === 'create') {
    return (
      <CreateQuizView 
        user={user} 
        onBack={() => setActiveView('home')}
        onQuizCreated={(quiz) => {
          setCreatedQuizzes(prev => [...prev, quiz]);
          setActiveView('home');
        }}
      />
    );
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
      
      <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap", marginTop: "1rem" }}>
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
          onClick={() => setActiveView('quiz')}
        >
          Take Sample Quiz 🚀
        </button>
        
        <button
          type="button"
          style={{
            backgroundColor: "#22c55e",
            color: "white",
            border: "none",
            padding: "0.75rem 1.5rem",
            borderRadius: "8px",
            fontSize: "1rem",
            cursor: "pointer",
          }}
          onClick={() => setActiveView('create')}
        >
          Create New Quiz 🪙
        </button>
      </div>

      {createdQuizzes.length > 0 && (
        <div style={{ marginTop: "2rem" }}>
          <h4>Your Created Quizzes</h4>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {createdQuizzes.map((quiz) => (
              <div 
                key={quiz.id}
                style={{
                  padding: "0.75rem",
                  backgroundColor: "#e0f2fe",
                  borderRadius: "6px",
                  border: "1px solid #0891b2",
                }}
              >
                <div style={{ fontWeight: "bold" }}>{quiz.name}</div>
                <div style={{ fontSize: "0.9rem", color: "#666" }}>
                  Coin: {quiz.coinAddress.substring(0, 10)}...
                </div>
                <div style={{ fontSize: "0.8rem", color: "#888" }}>
                  Created: {new Date(quiz.created).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {token && <p style={{ fontSize: "0.8rem", color: "#666", marginTop: "1rem" }}>Authenticated ✅</p>}
    </div>
  );
}

function CreateQuizView({
  user,
  onBack,
  onQuizCreated,
}: {
  user: { fid: number; displayName?: string; username?: string; pfpUrl?: string };
  onBack: () => void;
  onQuizCreated: (quiz: any) => void;
}) {
  const [step, setStep] = useState<'form' | 'creating' | 'success'>('form');
  const [quizName, setQuizName] = useState('');
  const [quizSymbol, setQuizSymbol] = useState('');
  const [description, setDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [createResult, setCreateResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();

  const handleCreateQuiz = async () => {
    if (!quizName.trim() || !quizSymbol.trim() || !address || !walletClient) {
      alert('Please fill in all fields and connect your wallet');
      return;
    }

    setIsCreating(true);
    setStep('creating');
    setError(null);

    try {
      console.log('🪙 Creating quiz coin with real wallet client...');
      
      // Check if we have required environment variables for Zora API
      const zoraApiKey = import.meta.env.VITE_ZORA_API_KEY;
      if (!zoraApiKey) {
        throw new Error('VITE_ZORA_API_KEY environment variable is required');
      }

      // Set Zora API key
      setApiKey(zoraApiKey);

      // Create public client for Base network
      const basePublicClient = createPublicClient({
        chain: base,
        transport: http(),
      });

      // Define coin parameters
      const coinParams = {
        name: quizName,
        symbol: quizSymbol,
        uri: description ? 
             `data:text/plain;charset=utf-8,${encodeURIComponent(description)}` as const : 
             "ipfs://bafybeigoxzqzbnxsn35vq7lls3ljxdcwjafxvbvkivprsodzrptpiguysy" as const,
        payoutRecipient: address as Address,
        chainId: base.id,
        currency: DeployCurrency.ZORA,
      };

      console.log('Creating coin with params:', {
        name: coinParams.name,
        symbol: coinParams.symbol,
        payoutRecipient: coinParams.payoutRecipient,
        chainId: coinParams.chainId,
      });

      // Create the coin using Zora's SDK
      const result = await createCoin(
        coinParams,
        walletClient,
        basePublicClient,
        { gasMultiplier: 120 }
      );

      console.log('✅ Coin created successfully!', result);

      const successResult = {
        success: true,
        coinAddress: result.address,
        txHash: result.hash,
        name: quizName,
        symbol: quizSymbol,
        creator: address,
        creatorFid: user.fid,
        deployment: result.deployment,
      };
      
      setCreateResult(successResult);
      setStep('success');
      
      // Add to created quizzes
      onQuizCreated({
        id: result.address,
        name: quizName,
        coinAddress: result.address,
        txHash: result.hash,
        created: Date.now(),
      });

    } catch (error: any) {
      console.error('❌ Error creating quiz coin:', error);
      
      let errorMessage = 'Failed to create quiz coin';
      if (error.message) {
        errorMessage += `: ${error.message}`;
      }
      
      // Check for common error cases
      if (error.message?.includes('insufficient funds')) {
        errorMessage = 'Insufficient funds to create coin. You need ETH for gas fees.';
      } else if (error.message?.includes('user rejected')) {
        errorMessage = 'Transaction was rejected by user.';
      } else if (error.message?.includes('VITE_ZORA_API_KEY')) {
        errorMessage = 'Zora API key not configured. Set VITE_ZORA_API_KEY in your environment.';
      }
      
      setError(errorMessage);
      alert(errorMessage);
      setStep('form');
    } finally {
      setIsCreating(false);
    }
  };

  if (step === 'creating') {
    return (
      <div className="quiz-card">
        <h2>🪙 Creating Quiz Coin...</h2>
        <div style={{ margin: "2rem 0", textAlign: "center" }}>
          <div
            style={{
              width: "40px",
              height: "40px",
              border: "3px solid #e6e6e6",
              borderTop: "3px solid #4ade80",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
              margin: "0 auto",
            }}
          />
          <p style={{ marginTop: "1rem", color: "#666" }}>
            Deploying "{quizName}" ({quizSymbol}) to Base network...
          </p>
          <p style={{ marginTop: "0.5rem", fontSize: "0.9rem", color: "#888" }}>
            Please confirm the transaction in your wallet
          </p>
        </div>
        
        {error && (
          <div style={{ 
            marginTop: "1rem", 
            padding: "1rem", 
            backgroundColor: "#fee", 
            borderRadius: "8px",
            color: "#c53030",
            fontSize: "0.9rem"
          }}>
            {error}
          </div>
        )}
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="quiz-card">
        <h2>🎉 Quiz Coin Created!</h2>
        <div style={{ margin: "2rem 0" }}>
          <div style={{ padding: "1rem", backgroundColor: "#f0f9ff", borderRadius: "8px", marginBottom: "1rem" }}>
            <h4>{quizName}</h4>
            <p><strong>Symbol:</strong> {quizSymbol}</p>
            {createResult?.coinAddress && (
              <p style={{ fontSize: "0.9rem", wordBreak: "break-all" }}>
                <strong>Coin Address:</strong> {createResult.coinAddress}
              </p>
            )}
            {createResult?.txHash && (
              <p style={{ fontSize: "0.9rem", wordBreak: "break-all" }}>
                <strong>Transaction:</strong> {createResult.txHash}
              </p>
            )}
            <p style={{ fontSize: "0.9rem", color: "#666" }}>
              <strong>Network:</strong> Base
            </p>
          </div>
        </div>
        
        <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
          <button
            type="button"
            className="quiz-submit-btn"
            onClick={onBack}
          >
            Back to Home
          </button>
          
          {createResult?.txHash && (
            <button
              type="button"
              style={{
                backgroundColor: "#8b5cf6",
                color: "white",
                border: "none",
                borderRadius: "12px",
                padding: "0.75rem 1.5rem",
                fontSize: "1rem",
                fontWeight: "600",
                cursor: "pointer",
              }}
              onClick={() => {
                window.open(`https://basescan.org/tx/${createResult.txHash}`, '_blank');
              }}
            >
              View on BaseScan 🔍
            </button>
          )}
          
          {createResult?.coinAddress && (
            <button
              type="button"
              style={{
                backgroundColor: "#0891b2",
                color: "white",
                border: "none",
                borderRadius: "12px",
                padding: "0.75rem 1.5rem",
                fontSize: "1rem",
                fontWeight: "600",
                cursor: "pointer",
              }}
              onClick={() => {
                window.open(`https://basescan.org/address/${createResult.coinAddress}`, '_blank');
              }}
            >
              View Coin Contract 📄
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="quiz-card">
      <h2>🪙 Create New Quiz</h2>
      <p style={{ marginBottom: "2rem", color: "#666" }}>
        Create a coin for your quiz that players can earn by participating
      </p>
      
      {!address && (
        <div style={{ 
          marginBottom: "2rem", 
          padding: "1rem", 
          backgroundColor: "#fff3cd", 
          borderRadius: "8px",
          border: "1px solid #ffc107"
        }}>
          <strong>⚠️ Wallet Required:</strong> Please connect your wallet to create a quiz coin.
        </div>
      )}
      
      {!import.meta.env.VITE_ZORA_API_KEY && (
        <div style={{ 
          marginBottom: "2rem", 
          padding: "1rem", 
          backgroundColor: "#fee", 
          borderRadius: "8px",
          border: "1px solid #f56565"
        }}>
          <strong>⚠️ Configuration Required:</strong> Set <code>VITE_ZORA_API_KEY</code> environment variable to enable real coin creation.
        </div>
      )}
      
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "2rem" }}>
        <div>
          <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>
            Quiz Name *
          </label>
          <input
            type="text"
            value={quizName}
            onChange={(e) => setQuizName(e.target.value)}
            placeholder="e.g., Crypto Knowledge Quiz"
            style={{
              width: "100%",
              padding: "0.75rem",
              border: "2px solid #ffd18c",
              borderRadius: "8px",
              fontSize: "1rem",
            }}
          />
        </div>
        
        <div>
          <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>
            Coin Symbol * (2-5 characters)
          </label>
          <input
            type="text"
            value={quizSymbol}
            onChange={(e) => setQuizSymbol(e.target.value.toUpperCase())}
            placeholder="e.g., CRYPTO"
            maxLength={5}
            style={{
              width: "100%",
              padding: "0.75rem",
              border: "2px solid #ffd18c",
              borderRadius: "8px",
              fontSize: "1rem",
            }}
          />
        </div>
        
        <div>
          <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe your quiz..."
            rows={3}
            style={{
              width: "100%",
              padding: "0.75rem",
              border: "2px solid #ffd18c",
              borderRadius: "8px",
              fontSize: "1rem",
              resize: "vertical",
            }}
          />
        </div>
      </div>

      <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
        <button
          type="button"
          style={{
            backgroundColor: "#6b7280",
            color: "white",
            border: "none",
            borderRadius: "12px",
            padding: "0.75rem 2rem",
            fontSize: "1.1rem",
            fontWeight: "600",
            cursor: "pointer",
          }}
          onClick={onBack}
        >
          Cancel
        </button>
        
        <button
          type="button"
          className="quiz-submit-btn"
          onClick={handleCreateQuiz}
          disabled={isCreating || !quizName.trim() || !quizSymbol.trim() || !address || !walletClient}
        >
          {isCreating ? 'Creating...' : 'Create Quiz Coin 🪙'}
        </button>
      </div>
      
      <div style={{ marginTop: "1.5rem", padding: "1rem", backgroundColor: "#f0f9ff", borderRadius: "8px", fontSize: "0.9rem" }}>
        <strong>💡 Real Coin Creation:</strong>
        <ul style={{ marginTop: "0.5rem", paddingLeft: "1.5rem" }}>
          <li>Creates an actual ERC-20 coin on Base network</li>
          <li>Requires ETH for gas fees (~$1-3)</li>
          <li>Players can earn and trade your coin</li>
          <li>You earn from trading fees as the creator</li>
          <li>Coin will appear in wallets and DEXs</li>
        </ul>
      </div>
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
