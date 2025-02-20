import { getAppDataSource } from "@/app/db/ormconfig";
import { Account } from "@/app/db/entities/Account";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const dataSource = await getAppDataSource();
    const accountRepository = dataSource.getRepository(Account);

    const { username } = await req.json();

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

    const account = await accountRepository.findOne({
      where: { username },
    });

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

export async function GET(req: Request) {
  return NextResponse.json({ message: "Hello, Agentic World!" });
}
