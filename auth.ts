import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";

const credentialsSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

function configuredPasswordHash() {
  let value = process.env.ADMIN_PASSWORD_HASH?.trim();
  if (!value) return null;

  const quote = value[0];
  if ((quote === '"' || quote === "'") && value.at(-1) === quote) {
    value = value.slice(1, -1);
  }

  // Next.js .env files require escaped dollar signs, while hosting dashboards
  // generally use the raw bcrypt hash. Accept either representation.
  value = value.replaceAll("\\$", "$");

  return /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(value) ? value : null;
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  // Production runs behind the site's reverse proxy. Auth.js requires the
  // forwarded Host header to be explicitly trusted outside supported hosts.
  trustHost: true,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/admin/login",
  },
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      authorize: async (credentials) => {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
        const passwordHash = configuredPasswordHash();
        if (!adminEmail || !passwordHash) {
          console.error(
            "[auth] ADMIN_EMAIL or ADMIN_PASSWORD_HASH is missing or malformed.",
          );
          return null;
        }
        if (parsed.data.email.toLowerCase() !== adminEmail) return null;

        const valid = await bcrypt.compare(parsed.data.password, passwordHash);
        if (!valid) return null;

        return {
          id: "admin",
          email: adminEmail,
          name: "Administrator",
        };
      },
    }),
  ],
});
