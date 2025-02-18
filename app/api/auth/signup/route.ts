import { getAppDataSource } from "@/app/db/ormconfig";
import { User } from "@/app/db/entities/User";
import { Passkey } from "@/app/db/entities/Passkey";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const AppDataSource = await getAppDataSource();

  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }

  return await AppDataSource.manager.transaction(
    async (transactionalEntityManager) => {
      try {
        const {
          username,
          email,
          organizationId,
          organizationName,
          userId,
          passkey,
        } = await req.json();

        // Validate required fields
        if (!username || !email || !organizationId || !userId || !passkey) {
          return NextResponse.json(
            { error: "Missing required fields" },
            { status: 400 }
          );
        }

        // Check if user already exists
        const existingUser = await transactionalEntityManager.findOne(User, {
          where: [{ username }, { email }],
        });

        if (existingUser) {
          return NextResponse.json(
            { error: "Username or email already exists" },
            { status: 400 }
          );
        }

        // Create new user
        const newUser = transactionalEntityManager.create(User, {
          username,
          email,
          organizationId,
          organizationName,
          userId,
        });

        const savedUser = await transactionalEntityManager.save(newUser);

        // Create passkey
        const newPasskey = transactionalEntityManager.create(Passkey, {
          challenge: passkey.challenge,
          attestation: passkey.attestation,
          user: savedUser,
        });

        await transactionalEntityManager.save(newPasskey);

        return NextResponse.json({
          user: {
            id: savedUser.id,
            username: savedUser.username,
            email: savedUser.email,
            organizationId: savedUser.organizationId,
            passkeys: [newPasskey],
          },
        });
      } catch (error) {
        console.error("Signup error:", error);
        return NextResponse.json(
          { error: "Failed to create user" },
          { status: 500 }
        );
      }
    }
  );
}
