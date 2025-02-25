import { getAppDataSource } from "@/app/db/ormconfig";
import { Account } from "@/app/db/entities/Account";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const username = url.searchParams.get("username");

    if (!username) {
      return NextResponse.json(
        { success: false, message: "Username is required" },
        { status: 400 }
      );
    }

    const dataSource = await getAppDataSource();
    const accountRepository = dataSource.getRepository(Account);

    const user = await accountRepository.findOne({
      where: { username },
    });

    return NextResponse.json({
      exists: !!user,
      user: user
        ? {
            ...user,
            hasPasskey: false, // You'll need to add logic to determine if user has passkey
          }
        : null,
    });
  } catch (error) {
    console.error("Error checking username:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
