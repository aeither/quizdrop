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
          onClick={() => alert("Quiz feature coming soon!")}
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

export default App;
