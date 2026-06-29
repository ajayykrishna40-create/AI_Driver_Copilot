const API_BASE_URL = "http://localhost:8001";

export async function login(
  email: string,
  password: string
) {
  const response = await fetch(
    `${API_BASE_URL}/login`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
      }),
    }
  );

  if (!response.ok) {
    throw new Error("Login failed");
  }

  return await response.json();
}



export async function register(payload: {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  confirm_password: string;
}) {
  const response = await fetch(
    `${API_BASE_URL}/register_user`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      typeof data.detail === "string"
        ? data.detail
        : data.detail?.message ||
            JSON.stringify(data.detail) ||
            "Registration failed"
    );
  }

  return data;
}

export async function agentChat(
  driverId: string,
  messages: { role: string; content: string }[],
  sessionId?: number
) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}/agent/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("authToken")}`,
      },
      body: JSON.stringify({
        driver_id: driverId,
        messages,
        session_id: sessionId,
      }),
    });
  } catch (networkError) {
    throw new Error("Unable to reach the agent service. Check backend connectivity.");
  }

  if (!response.ok) {
    const bodyText = await response.text().catch(() => "");
    let message = bodyText;

    try {
      const errorData = JSON.parse(bodyText || "{}");
      message = errorData?.detail || errorData?.message || message;
    } catch {
      // invalid JSON is fine, use raw body text
    }

    if (!message) {
      message = response.statusText || `Agent chat request failed (${response.status})`;
    }

    throw new Error(message);
  }

  try {
    return await response.json();
  } catch {
    throw new Error("Agent chat returned invalid response format.");
  }
}