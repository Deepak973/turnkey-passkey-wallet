import { getAppDataSource } from "@/app/db/ormconfig";
import { Account } from "@/app/db/entities/Account";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const userEmail = url.searchParams.get("userEmail");

    if (!userEmail) {
      return NextResponse.json(
        { success: false, message: "Email is required" },
        { status: 400 }
      );
    }

    const dataSource = await getAppDataSource();
    const accountRepository = dataSource.getRepository(Account);

    // Find user by email with all details
    const user = await accountRepository.findOne({
      where: { email: userEmail },
      select: [
        "id",
        "username",
        "email",
        "organizationId",
        "organizationName",
        "walletAddress",
        "userId",
        "hasPasskey",
        "createdAt",
        "updatedAt",
      ],
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        organizationId: user.organizationId,
        organizationName: user.organizationName,
        walletAddress: user.walletAddress,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        userId: user.userId,
        hasPasskey: user.hasPasskey,
      },
    });
  } catch (error) {
    console.error("Error fetching user details:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch user details" },
      { status: 500 }
    );
  }
}
