import { getAppDataSource } from "@/app/db/ormconfig";
import { Account } from "@/app/db/entities/Account";
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

        const account = await transactionalEntityManager.findOne(Account, {
          where: { username },
        });

        // ✅ 404 Not Found → When user does not exist
        if (!account) {
          return NextResponse.json(
            {
              success: false,
              message:
                "Account not found. Please check your username and try again.",
              code: "ACCOUNT_NOT_FOUND",
            },
            { status: 404 }
          );
        }

        // ✅ 200 OK → Success
        return NextResponse.json(
          {
            success: true,
            user: {
              id: account.id,
              username: account.username,
              email: account.email,
              organizationId: account.organizationId,
              organizationName: account.organizationName,
              walletAddress: account.walletAddress,
            },
          },
          { status: 200 }
        );
      } catch (error) {
        console.error("Login error:", error);

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
