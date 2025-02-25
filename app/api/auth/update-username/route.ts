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

    // Find user by email
    const user = await accountRepository.findOne({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // Update username
    user.username = username;
    await accountRepository.save(user);

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error("Error updating username:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update username" },
      { status: 500 }
    );
  }
}
