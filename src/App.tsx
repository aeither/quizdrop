import { sdk } from "@farcaster/frame-sdk";
import { DeployCurrency, type TradeParameters, createCoin, setApiKey, tradeCoin } from '@zoralabs/coins-sdk';
import { useEffect, useState } from "react";
import { type Address, type Hex, createPublicClient, createWalletClient, http, isAddress, parseEther } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { base } from "viem/chains";
import { useAccount, useConnect, usePublicClient, useWalletClient } from "wagmi";
import { type CreateQuizInput, createQuiz, getAllQuizzes, getQuizzesByCreatorFid } from "./db/mock-operations";

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
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <div style={{ flex: 1, textAlign: "center" }}>
        <h1>🎯 QuizDrop</h1>
        {user ? <AuthenticatedView user={user} token={authToken} /> : <AuthenticationPrompt onAuth={setUser} />}
      </div>
      {user && <ConnectMenu />}
    </div>
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
      <div style={{
        position: "fixed",
        bottom: "1rem",
        right: "1rem",
        background: "rgba(255, 255, 255, 0.95)",
        backdropFilter: "blur(10px)",
        border: "1px solid #e5e7eb",
        borderRadius: "12px",
        padding: "0.75rem 1rem",
        fontSize: "0.85rem",
        color: "#6b7280",
        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
        maxWidth: "250px",
        wordBreak: "break-all"
      }}>
        <div style={{ fontWeight: "600", marginBottom: "0.25rem" }}>💳 Connected</div>
        <div>{address?.substring(0, 6)}...{address?.substring(address.length - 4)}</div>
      </div>
    );
  }

  return (
    <div style={{
      position: "fixed",
      bottom: "1rem",
      right: "1rem",
    }}>
      <button 
        type="button" 
        onClick={() => connect({ connector: connectors[0] })}
        style={{
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          color: "white",
          border: "none",
          borderRadius: "12px",
          padding: "0.75rem 1.5rem",
          fontSize: "1rem",
          fontWeight: "600",
          cursor: "pointer",
          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
          transition: "transform 0.2s, box-shadow 0.2s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-2px)";
          e.currentTarget.style.boxShadow = "0 8px 12px -1px rgba(0, 0, 0, 0.15)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "0 4px 6px -1px rgba(0, 0, 0, 0.1)";
        }}
      >
        💳 Connect Wallet
      </button>
    </div>
  );
}

function SignButton() {
  // Hidden component - keeping for potential future use
  return null;
}

function AuthenticatedView({
  user,
  token,
}: { user: { fid: number; displayName?: string; username?: string; pfpUrl?: string }; token: string | null }) {
  const [activeView, setActiveView] = useState<'home' | 'quiz' | 'create' | 'trade'>('home');
  const [allQuizzes, setAllQuizzes] = useState<any[]>([]);
  const [userQuizzes, setUserQuizzes] = useState<any[]>([]);
  const [selectedQuiz, setSelectedQuiz] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load quizzes on mount
  useEffect(() => {
    const loadQuizzes = async () => {
      try {
        const [all, userCreated] = await Promise.all([
          getAllQuizzes(),
          getQuizzesByCreatorFid(user.fid)
        ]);
        setAllQuizzes(all);
        setUserQuizzes(userCreated);
      } catch (error) {
        console.error('Error loading quizzes:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadQuizzes();
  }, [user.fid]);

  if (activeView === 'quiz') {
    return <QuizGame onExit={() => setActiveView('home')} user={user} quiz={selectedQuiz} />;
  }

  if (activeView === 'trade') {
    return <TradingView onBack={() => setActiveView('home')} quiz={selectedQuiz} />;
  }

  if (activeView === 'create') {
    return (
      <CreateQuizView 
        user={user} 
        onBack={() => setActiveView('home')}
        onQuizCreated={async (quiz) => {
          // Refresh quiz lists
          const [all, userCreated] = await Promise.all([
            getAllQuizzes(),
            getQuizzesByCreatorFid(user.fid)
          ]);
          setAllQuizzes(all);
          setUserQuizzes(userCreated);
          setActiveView('home');
        }}
      />
    );
  }

  if (isLoading) {
    return (
      <div style={{ textAlign: "center", padding: "2rem" }}>
        <div style={{ 
          width: "40px", 
          height: "40px", 
          border: "3px solid #e6e6e6", 
          borderTop: "3px solid #4ade80", 
          borderRadius: "50%", 
          animation: "spin 1s linear infinite", 
          margin: "0 auto 1rem" 
        }} />
        <p>Loading quizzes...</p>
      </div>
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
          onClick={() => {
            setSelectedQuiz(null);
            setActiveView('quiz');
          }}
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

      {/* All Available Quizzes */}
      {allQuizzes.length > 0 && (
        <div style={{ marginTop: "2rem" }}>
          <h4>🎯 Available Quizzes</h4>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1rem" }}>
            {allQuizzes.map((quiz) => (
              <div 
                key={quiz.id}
                style={{
                  padding: "1rem",
                  backgroundColor: "#ffffff",
                  borderRadius: "8px",
                  border: "1px solid #e5e7eb",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                }}
              >
                <div style={{ fontWeight: "bold", fontSize: "1.1rem", marginBottom: "0.5rem" }}>
                  {quiz.name} ({quiz.symbol})
                </div>
                {quiz.description && (
                  <div style={{ fontSize: "0.9rem", color: "#666", marginBottom: "0.5rem" }}>
                    {quiz.description}
                  </div>
                )}
                <div style={{ fontSize: "0.8rem", color: "#888", marginBottom: "1rem" }}>
                  Coin: {quiz.coinAddress.substring(0, 10)}...
                </div>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button
                    type="button"
                    style={{
                      backgroundColor: "#667eea",
                      color: "white",
                      border: "none",
                      padding: "0.5rem 1rem",
                      borderRadius: "6px",
                      fontSize: "0.9rem",
                      cursor: "pointer",
                      flex: 1,
                    }}
                    onClick={() => {
                      setSelectedQuiz(quiz);
                      setActiveView('quiz');
                    }}
                  >
                    Play 🎮
                  </button>
                  <button
                    type="button"
                    style={{
                      backgroundColor: "#f59e0b",
                      color: "white",
                      border: "none",
                      padding: "0.5rem 1rem",
                      borderRadius: "6px",
                      fontSize: "0.9rem",
                      cursor: "pointer",
                      flex: 1,
                    }}
                    onClick={() => {
                      setSelectedQuiz(quiz);
                      setActiveView('trade');
                    }}
                  >
                    Trade 💰
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* User's Created Quizzes */}
      {userQuizzes.length > 0 && (
        <div style={{ marginTop: "2rem" }}>
          <h4>🏆 Your Created Quizzes</h4>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {userQuizzes.map((quiz) => (
              <div 
                key={quiz.id}
                style={{
                  padding: "0.75rem",
                  backgroundColor: "#e0f2fe",
                  borderRadius: "6px",
                  border: "1px solid #0891b2",
                }}
              >
                <div style={{ fontWeight: "bold" }}>{quiz.name} ({quiz.symbol})</div>
                <div style={{ fontSize: "0.9rem", color: "#666" }}>
                  Coin: {quiz.coinAddress.substring(0, 10)}...
                </div>
                <div style={{ fontSize: "0.8rem", color: "#888" }}>
                  Created: {new Date(quiz.createdAt).toLocaleDateString()}
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
  const [redirectToQuiz, setRedirectToQuiz] = useState(false);
  
  const { address } = useAccount();

  // Redirect to quiz if user chooses to play
  if (redirectToQuiz) {
    return <QuizGame onExit={onBack} user={user} />;
  }

  // Check if we have the required environment variables
  const hasRequiredEnvVars = () => {
    const envVars = {
      VITE_ZORA_API_KEY: import.meta.env.VITE_ZORA_API_KEY,
      VITE_PRIVATE_KEY: import.meta.env.VITE_PRIVATE_KEY,
      VITE_RPC_URL: import.meta.env.VITE_RPC_URL,
      VITE_PAYOUT_RECIPIENT: import.meta.env.VITE_PAYOUT_RECIPIENT,
    };
    
    // Debug logging
    console.log('🔍 Environment variables check:', {
      VITE_ZORA_API_KEY: envVars.VITE_ZORA_API_KEY ? 'SET' : 'MISSING',
      VITE_PRIVATE_KEY: envVars.VITE_PRIVATE_KEY ? 'SET' : 'MISSING', 
      VITE_RPC_URL: envVars.VITE_RPC_URL ? 'SET' : 'MISSING',
      VITE_PAYOUT_RECIPIENT: envVars.VITE_PAYOUT_RECIPIENT ? 'SET' : 'MISSING',
    });
    
    return !!(
      envVars.VITE_ZORA_API_KEY &&
      envVars.VITE_PRIVATE_KEY &&
      envVars.VITE_RPC_URL &&
      envVars.VITE_PAYOUT_RECIPIENT
    );
  };

  const handleCreateQuiz = async () => {
    if (!quizName.trim() || !quizSymbol.trim()) {
      alert('Please fill in quiz name and symbol');
      return;
    }

    if (!hasRequiredEnvVars()) {
      alert('Missing required environment variables. Please check your .env.local file.');
      return;
    }

    setIsCreating(true);
    setStep('creating');
    setError(null);

    try {
      console.log('🪙 Creating quiz coin with environment private key...');
      
      // Get environment variables
      const zoraApiKey = import.meta.env.VITE_ZORA_API_KEY;
      const privateKeyRaw = import.meta.env.VITE_PRIVATE_KEY;
      const rpcUrl = import.meta.env.VITE_RPC_URL;
      const payoutRecipient = import.meta.env.VITE_PAYOUT_RECIPIENT;

      console.log('🔍 Environment values loaded:', {
        zoraApiKey: zoraApiKey ? `${zoraApiKey.substring(0, 20)}...` : 'MISSING',
        privateKeyRaw: privateKeyRaw ? `${privateKeyRaw.substring(0, 10)}...` : 'MISSING',
        rpcUrl: rpcUrl || 'MISSING',
        payoutRecipient: payoutRecipient || 'MISSING',
      });

      // Validate payout address format
      if (!isAddress(payoutRecipient)) {
        throw new Error('Invalid VITE_PAYOUT_RECIPIENT: Must be a valid Ethereum address');
      }

      // Set Zora API key
      console.log('🔑 Setting Zora API key...');
      setApiKey(zoraApiKey);

      // Ensure private key has 0x prefix
      const privateKey = privateKeyRaw.startsWith('0x') 
        ? privateKeyRaw as Hex
        : (`0x${privateKeyRaw}` as Hex);

      console.log('🔐 Creating account from private key...');
      // Create account from private key
      const account = privateKeyToAccount(privateKey);
      console.log('✅ Account created:', account.address);

      console.log('🌐 Creating blockchain clients...');
      // Create clients
      const publicClient = createPublicClient({
        chain: base,
        transport: http(rpcUrl),
      });

      const walletClient = createWalletClient({
        account,
        chain: base,
        transport: http(rpcUrl),
      });
      console.log('✅ Clients created successfully');

      // Define coin parameters
      const coinParams = {
        name: quizName,
        symbol: quizSymbol,
        uri: "ipfs://bafybeigoxzqzbnxsn35vq7lls3ljxdcwjafxvbvkivprsodzrptpiguysy" as const,
        payoutRecipient: payoutRecipient as Address,
        chainId: base.id,
        currency: DeployCurrency.ZORA,
      };

      console.log('🪙 Creating coin with params:', {
        name: coinParams.name,
        symbol: coinParams.symbol,
        payoutRecipient: coinParams.payoutRecipient,
        chainId: coinParams.chainId,
        account: account.address,
        uri: coinParams.uri.length > 50 ? `${coinParams.uri.substring(0, 50)}...` : coinParams.uri,
      });

      // Create the coin using Zora's SDK
      console.log('🚀 Calling createCoin function...');
      const result = await createCoin(
        coinParams,
        walletClient,
        publicClient,
        { gasMultiplier: 120 }
      );

      console.log('✅ Coin created successfully!', result);

      const successResult = {
        success: true,
        coinAddress: result.address,
        txHash: result.hash,
        name: quizName,
        symbol: quizSymbol,
        creator: account.address,
        creatorFid: user.fid,
        deployment: result.deployment,
      };
      
      setCreateResult(successResult);
      setStep('success');
      
      // Save to database
      try {
        const quizData: CreateQuizInput = {
          name: quizName,
          symbol: quizSymbol,
          description: description || undefined,
          coinAddress: result.address as string,
          txHash: result.hash as string,
          creatorAddress: account.address,
          creatorFid: user.fid,
        };
        
        await createQuiz(quizData);
        console.log('✅ Quiz saved to database');
      } catch (dbError) {
        console.warn('⚠️ Could not save to database:', dbError);
      }
      
      // Notify parent component
      onQuizCreated(successResult);

    } catch (error: any) {
      console.error('❌ Error creating quiz coin:', error);
      
      let errorMessage = 'Failed to create quiz coin';
      if (error.message) {
        errorMessage += `: ${error.message}`;
      }
      
      // Check for common error cases
      if (error.message?.includes('insufficient funds')) {
        errorMessage = 'Insufficient funds to create coin. You need ETH for gas fees.';
      } else if (error.message?.includes('Invalid VITE_PAYOUT_RECIPIENT')) {
        errorMessage = 'Invalid payout recipient address in environment variables.';
      } else if (error.message?.includes('private key')) {
        errorMessage = 'Invalid private key in environment variables.';
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
            Transaction is being processed on the blockchain
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
            {createResult?.creator && (
              <p style={{ fontSize: "0.9rem", wordBreak: "break-all" }}>
                <strong>Creator:</strong> {createResult.creator}
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
            onClick={() => setRedirectToQuiz(true)}
          >
            🎮 Play Your Quiz
          </button>
          
          <button
            type="button"
            style={{
              backgroundColor: "#6b7280",
              color: "white",
              border: "none",
              borderRadius: "12px",
              padding: "0.75rem 1.5rem",
              fontSize: "1rem",
              fontWeight: "600",
              cursor: "pointer",
            }}
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
      
      {!hasRequiredEnvVars() && (
        <div style={{ 
          marginBottom: "2rem", 
          padding: "1rem", 
          backgroundColor: "#fee", 
          borderRadius: "8px",
          border: "1px solid #f56565"
        }}>
          <strong>⚠️ Configuration Required:</strong> Set environment variables in <code>.env.local</code>:
          <ul style={{ marginTop: "0.5rem", paddingLeft: "1.5rem", fontSize: "0.9rem" }}>
            <li><code>VITE_ZORA_API_KEY</code></li>
            <li><code>VITE_PRIVATE_KEY</code></li>
            <li><code>VITE_RPC_URL</code></li>
            <li><code>VITE_PAYOUT_RECIPIENT</code></li>
          </ul>
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
          disabled={isCreating || !quizName.trim() || !quizSymbol.trim() || !hasRequiredEnvVars()}
        >
          {isCreating ? 'Creating...' : 'Create Quiz Coin 🪙'}
        </button>
      </div>
      
      <div style={{ marginTop: "1.5rem", padding: "1rem", backgroundColor: "#f0f9ff", borderRadius: "8px", fontSize: "0.9rem" }}>
        <strong>💡 Real Coin Creation:</strong>
        <ul style={{ marginTop: "0.5rem", paddingLeft: "1.5rem" }}>
          <li>Creates an actual ERC-20 coin on Base network</li>
          <li>Uses your configured private key for transactions</li>
          <li>Requires ETH in the configured wallet for gas fees (~$1-3)</li>
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
  quiz,
}: {
  user: { fid: number; displayName?: string; username?: string; pfpUrl?: string };
  onExit: () => void;
  quiz?: { id: number; name: string; symbol: string; coinAddress: string; description?: string };
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
        {quiz && (
          <div style={{ marginBottom: "1rem", padding: "0.5rem", backgroundColor: "#f0f9ff", borderRadius: "6px" }}>
            <strong>{quiz.name}</strong> ({quiz.symbol})
          </div>
        )}
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

function TradingView({
  onBack,
  quiz,
}: {
  onBack: () => void;
  quiz?: { id: number; name: string; symbol: string; coinAddress: string; description?: string };
}) {
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
  const [ethAmount, setEthAmount] = useState('');
  const [isTrading, setIsTrading] = useState(false);
  const [, setTradeResult] = useState<{ transactionHash: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  const handleTrade = async () => {
    if (!quiz || !address || !ethAmount || !isConnected || !walletClient || !publicClient) {
      alert('Please connect wallet and enter amount');
      return;
    }

    setIsTrading(true);
    setError(null);

    try {
      // Set Zora API key if not already set
      const zoraApiKey = import.meta.env.VITE_ZORA_API_KEY;
      if (zoraApiKey) {
        setApiKey(zoraApiKey);
      }
      
      // Convert amount to wei
      const amountInWei = parseEther(ethAmount);
      
      // Create trade parameters
      const tradeParameters: TradeParameters = {
        sell: tradeType === 'buy' ? { type: "eth" } : { type: "erc20", address: quiz.coinAddress as Address },
        buy: tradeType === 'buy' ? { type: "erc20", address: quiz.coinAddress as Address } : { type: "eth" },
        amountIn: amountInWei,
        slippage: 0.05, // 5% slippage tolerance
        sender: address,
      };

      console.log('Trading with parameters:', tradeParameters);

      // Execute the trade
      if (!walletClient.account) {
        throw new Error('No account found in wallet client');
      }
      
      const result = await tradeCoin({
        tradeParameters,
        walletClient,
        account: walletClient.account,
        publicClient,
      });

      setTradeResult({ transactionHash: result.transactionHash });
      alert(`Trade successful! Transaction: ${result.transactionHash}`);
    } catch (error: unknown) {
      console.error('Trade failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Trade failed';
      setError(errorMessage);
      alert(`Trade failed: ${errorMessage}`);
    } finally {
      setIsTrading(false);
    }
  };

  if (!quiz) {
    return (
      <div className="quiz-card">
        <h2>❌ No Quiz Selected</h2>
        <p>Please select a quiz to trade its coin.</p>
        <button type="button" onClick={onBack} className="quiz-submit-btn">
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <div className="quiz-card">
      <h2>💰 Trade {quiz.name} ({quiz.symbol})</h2>
      
      <div style={{ marginBottom: "2rem", padding: "1rem", backgroundColor: "#f0f9ff", borderRadius: "8px" }}>
        <div style={{ fontWeight: "bold", marginBottom: "0.5rem" }}>{quiz.name}</div>
        <div style={{ fontSize: "0.9rem", color: "#666" }}>
          Coin Address: {quiz.coinAddress}
        </div>
      </div>

      <div style={{ marginBottom: "2rem" }}>
        <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
          <button
            type="button"
            onClick={() => setTradeType('buy')}
            style={{
              flex: 1,
              padding: "0.75rem",
              backgroundColor: tradeType === 'buy' ? "#22c55e" : "#e5e7eb",
              color: tradeType === 'buy' ? "white" : "#374151",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
            }}
          >
            Buy with ETH
          </button>
          <button
            type="button"
            onClick={() => setTradeType('sell')}
            style={{
              flex: 1,
              padding: "0.75rem",
              backgroundColor: tradeType === 'sell' ? "#ef4444" : "#e5e7eb",
              color: tradeType === 'sell' ? "white" : "#374151",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
            }}
          >
            Sell for ETH
          </button>
        </div>

        <div>
          <label htmlFor="ethAmount" style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>
            {tradeType === 'buy' ? 'ETH Amount to Spend' : 'Token Amount to Sell'}
          </label>
          <input
            id="ethAmount"
            type="number"
            value={ethAmount}
            onChange={(e) => setEthAmount(e.target.value)}
            placeholder="0.001"
            step="0.001"
            style={{
              width: "100%",
              padding: "0.75rem",
              border: "2px solid #ffd18c",
              borderRadius: "8px",
              fontSize: "1rem",
            }}
          />
        </div>
      </div>

      {error && (
        <div style={{ 
          marginBottom: "1rem", 
          padding: "1rem", 
          backgroundColor: "#fee", 
          borderRadius: "8px",
          color: "#c53030" 
        }}>
          Error: {error}
        </div>
      )}

      <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
        <button
          type="button"
          onClick={onBack}
          style={{
            backgroundColor: "#6b7280",
            color: "white",
            border: "none",
            borderRadius: "12px",
            padding: "0.75rem 2rem",
            fontSize: "1rem",
            cursor: "pointer",
          }}
        >
          Back
        </button>
        
        <button
          type="button"
          onClick={handleTrade}
          disabled={isTrading || !ethAmount || !isConnected || !walletClient}
          style={{
            backgroundColor: isTrading || !isConnected || !walletClient ? "#ccc" : (tradeType === 'buy' ? "#22c55e" : "#ef4444"),
            color: "white",
            border: "none",
            borderRadius: "12px",
            padding: "0.75rem 2rem",
            fontSize: "1rem",
            cursor: isTrading || !ethAmount || !isConnected || !walletClient ? "not-allowed" : "pointer",
          }}
        >
          {isTrading ? 'Trading...' : !isConnected ? 'Connect Wallet' : `${tradeType === 'buy' ? 'Buy' : 'Sell'} ${quiz.symbol}`}
        </button>
      </div>

      <div style={{ marginTop: "1.5rem", padding: "1rem", backgroundColor: "#f0f9ff", borderRadius: "8px", fontSize: "0.9rem" }}>
        <strong>💡 Trading Info:</strong>
        <ul style={{ marginTop: "0.5rem", paddingLeft: "1.5rem" }}>
          <li>Trade directly on Base mainnet using Zora's Coins SDK</li>
          <li>5% slippage tolerance included</li>
          <li>Requires connected wallet with ETH for gas fees</li>
          <li>Uses permit signatures for secure, gasless approvals</li>
          <li>Supports ETH ↔ Creator Coin swaps</li>
          <li>Make sure you have enough ETH for the trade amount + gas</li>
        </ul>
      </div>
    </div>
  );
}

export default App;
