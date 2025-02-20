import { getAppDataSource } from "@/app/db/ormconfig";
import { Account } from "@/app/db/entities/Account";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const dataSource = await getAppDataSource();
    const accountRepository = dataSource.getRepository(Account);

    const { email, username, organizationId, organizationName, walletAddress } =
      await req.json();

    // Check if user already exists
    const existingUser = await accountRepository.findOne({
      where: [{ email }, { username }],
    });

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          message: "User already exists",
          code: "USER_EXISTS",
        },
        { status: 409 }
      );
    }

    // Create new account
    const account = accountRepository.create({
      email,
      username,
      organizationId,
      organizationName,
      walletAddress,
    });

    await accountRepository.save(account);

    return NextResponse.json(
      {
        success: true,
        user: account,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "An error occurred during signup",
        code: "SERVER_ERROR",
      },
      { status: 500 }
    );
  }
}
