import { getAppDataSource } from "@/app/db/ormconfig";
import { Account } from "@/app/db/entities/Account";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const AppDataSource = await getAppDataSource();

  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }

  return await AppDataSource.manager.transaction(
    async (transactionalEntityManager) => {
      try {
        const { username, email, organizationId, organizationName } =
          await req.json();

        // Create new account
        const account = transactionalEntityManager.create(Account, {
          username,
          email,
          organizationId,
          organizationName,
        });

        await transactionalEntityManager.save(account);

        return NextResponse.json({
          success: true,
          user: {
            id: account.id,
            username: account.username,
            email: account.email,
            organizationId: account.organizationId,
            organizationName: account.organizationName,
            walletAddress: account.walletAddress,
          },
        });
      } catch (error: any) {
        console.error("Signup error:", error);

        if (error.code === "23505") {
          // Unique constraint violation
          return NextResponse.json(
            {
              success: false,
              message: "Username or email already exists",
              code: "DUPLICATE_ENTRY",
            },
            { status: 409 }
          );
        }

        return NextResponse.json(
          {
            success: false,
            message: "Failed to create account",
            code: "SERVER_ERROR",
          },
          { status: 500 }
        );
      }
    }
  );
}
