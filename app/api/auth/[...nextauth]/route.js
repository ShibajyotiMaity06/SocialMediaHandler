import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import dbConnect from "../../lib/mongodb";
import User from "../../lib/models/User";
import Usage from "../../lib/models/Usage";
import { getCurrentMonth, TIER_LIMITS } from "../../lib/helpers";

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Please enter email and password");
        }

        await dbConnect();

        const user = await User.findOne({ email: credentials.email.toLowerCase() });

        if (!user) {
          throw new Error("No account found with this email");
        }

        if (!user.password) {
          throw new Error("This account uses Google sign-in. Please sign in with Google.");
        }

        const isValid = await bcrypt.compare(credentials.password, user.password);

        if (!isValid) {
          throw new Error("Invalid password");
        }

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          image: user.image,
          tier: user.tier,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        try {
          await dbConnect();

          const existingUser = await User.findOne({ email: user.email.toLowerCase() });

          if (!existingUser) {
            const newUser = await User.create({
              name: user.name,
              email: user.email.toLowerCase(),
              image: user.image,
              provider: "google",
              tier: "free",
            });
            user.id = newUser._id.toString();
            user.tier = newUser.tier;

            // Create usage record for first month
            const month = getCurrentMonth();
            const limits = TIER_LIMITS.free;
            await Usage.create({
              user_id: newUser._id,
              month,
              videos_used: 0,
              videos_limit: limits.videos,
              images_used: 0,
              images_limit: limits.images,
            });
          } else {
            user.id = existingUser._id.toString();
            user.tier = existingUser.tier;
          }
        } catch (error) {
          console.error("Error during Google sign-in:", error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
        token.tier = user.tier;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.userId;
        session.user.tier = token.tier;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };
