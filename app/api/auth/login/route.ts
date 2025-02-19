import { getAppDataSource } from "@/app/db/ormconfig";
import { User } from "@/app/db/entities/User";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const AppDataSource = await getAppDataSource();

  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize(); // Ensure the database is connected
  }

  // Using transaction
  return await AppDataSource.manager.transaction(
    async (transactionalEntityManager) => {
      try {
        const { username } = await req.json();

        // ✅ 400 Bad Request → When username is missing
        if (!username) {
          return NextResponse.json(
            {
              success: false,
              message: "Username is required",
              code: "USERNAME_REQUIRED",
            },
            { status: 400 }
          );
        }

        const user = await transactionalEntityManager.findOne(User, {
          where: { username },
          relations: ["passkeys"],
        });

        // ✅ 404 Not Found → When user does not exist
        if (!user) {
          return NextResponse.json(
            {
              success: false,
              message:
                "User not found. Please check your username and try again.",
              code: "USER_NOT_FOUND",
            },
            { status: 404 }
          );
        }

        // ✅ 403 Forbidden → When user exists but has no passkeys
        if (!user.passkeys?.length) {
          return NextResponse.json(
            {
              success: false,
              message:
                "No passkey found for this user. Please set up a passkey first.",
              code: "NO_PASSKEY",
            },
            { status: 403 }
          );
        }

        // ✅ 200 OK → Success
        return NextResponse.json(
          {
            success: true,
            user: {
              id: user.id,
              username: user.username,
              email: user.email,
              organizationId: user.organizationId,
              passkeys: user.passkeys,
            },
          },
          { status: 200 }
        );
      } catch (error) {
        console.error("Login error:", error);

        // ✅ 500 Internal Server Error → Unexpected server error
        return NextResponse.json(
          {
            success: false,
            message: "An error occurred during login. Please try again.",
            code: "SERVER_ERROR",
          },
          { status: 500 }
        );
      }
    }
  );
}

export async function GET(req: Request) {
  return NextResponse.json({ message: "Hello, world!" });
}
