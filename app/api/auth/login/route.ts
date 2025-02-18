import { getAppDataSource } from "@/app/db/ormconfig";
import { User } from "@/app/db/entities/User";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const AppDataSource = await getAppDataSource();
  //   console.log("AppDataSource", AppDataSource);
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize(); // Ensure the database is connected
  }
  // Using transaction
  return await AppDataSource.manager.transaction(
    async (transactionalEntityManager) => {
      try {
        const { username } = await req.json();

        if (!username) {
          return NextResponse.json(
            { error: "Username is required" },
            { status: 400 }
          );
        }

        const user = await transactionalEntityManager.findOne(User, {
          where: { username },
          relations: ["passkeys"],
        });

        if (!user) {
          return NextResponse.json(
            { error: "User not found" },
            { status: 404 }
          );
        }

        return NextResponse.json({
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            organizationId: user.organizationId,
            passkeys: user.passkeys,
          },
        });
      } catch (error) {
        console.error("Login error:", error);
        return NextResponse.json({ error: "Login failed" }, { status: 500 });
      }
    }
  );
}

export async function GET(req: Request) {
  return NextResponse.json({ message: "Hello, world!" });
}
