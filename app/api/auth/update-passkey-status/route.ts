import { getAppDataSource } from "@/app/db/ormconfig";
import { Account } from "@/app/db/entities/Account";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { success: false, message: "Email is required" },
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

    // Update hasPasskey status
    user.hasPasskey = true;
    await accountRepository.save(user);

    return NextResponse.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Error updating passkey status:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update passkey status" },
      { status: 500 }
    );
  }
}
