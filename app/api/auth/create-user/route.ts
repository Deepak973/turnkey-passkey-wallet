import { getAppDataSource } from "@/app/db/ormconfig";
import { Account } from "@/app/db/entities/Account";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { email, username } = await req.json();

    if (!email || !username) {
      return NextResponse.json(
        { success: false, message: "Email and username are required" },
        { status: 400 }
      );
    }

    const dataSource = await getAppDataSource();
    const accountRepository = dataSource.getRepository(Account);

    // Create new account
    const account = accountRepository.create({
      email,
      username,
      organizationId: "", // Will be set during auth
      organizationName: "", // Will be set during auth
      walletAddress: "", // Will be set during auth
    });

    await accountRepository.save(account);

    return NextResponse.json({ success: true, user: account });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create user" },
      { status: 500 }
    );
  }
}
