import { NextRequest, NextResponse } from "next/server";

export type AuthentikUser = {
  username: string;
  name: string;
  email: string;
  groups: string[];
  uid: string;
  avatar: string;
};

/**
 * Reads Authentik forward-auth headers injected by Traefik and optionally
 * enriches with avatar from the Authentik API.
 *
 * Headers set by authentik forward-auth:
 *   X-authentik-username, X-authentik-name, X-authentik-email,
 *   X-authentik-groups, X-authentik-uid
 */
export async function GET(req: NextRequest) {
  const username = req.headers.get("x-authentik-username") ?? "";
  const name = req.headers.get("x-authentik-name") ?? "";
  const email = req.headers.get("x-authentik-email") ?? "";
  const groups = req.headers.get("x-authentik-groups") ?? "";
  const uid = req.headers.get("x-authentik-uid") ?? "";

  if (!username && !email) {
    return NextResponse.json(
      { authenticated: false, user: null },
      { status: 200 }
    );
  }

  const user: AuthentikUser = {
    username,
    name,
    email,
    groups: groups ? groups.split("|") : [],
    uid,
    avatar: "",
  };

  const authentikUrl = process.env.AUTHENTIK_URL;
  const authentikToken = process.env.AUTHENTIK_API_TOKEN;

  if (authentikUrl && authentikToken && uid) {
    try {
      const res = await fetch(
        `${authentikUrl}/api/v3/core/users/?search=${encodeURIComponent(username)}&page_size=1`,
        {
          headers: { Authorization: `Bearer ${authentikToken}` },
          signal: AbortSignal.timeout(5000),
          next: { revalidate: 300 },
        }
      );

      if (res.ok) {
        const data = await res.json();
        const matchedUser = data.results?.[0];
        if (matchedUser) {
          user.avatar = matchedUser.avatar ?? "";
          if (!user.name && matchedUser.name) user.name = matchedUser.name;
        }
      }
    } catch {
      // Authentik API unavailable — headers still provide the essentials
    }
  }

  return NextResponse.json({ authenticated: true, user });
}
