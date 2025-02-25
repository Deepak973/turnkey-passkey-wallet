import { getAppDataSource } from "@/app/db/ormconfig";
import { Account } from "@/app/db/entities/Account";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const email = url.searchParams.get("email");

  if (!email) {
    return NextResponse.json(
      { success: false, message: "Email is required" },
      { status: 400 }
    );
  }

  try {
    const dataSource = await getAppDataSource();
    const accountRepository = dataSource.getRepository(Account);

    const user = await accountRepository.findOne({
      where: { email },
    });

    return NextResponse.json({ exists: !!user, user });
  } catch (error) {
    console.error("Error checking email:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
