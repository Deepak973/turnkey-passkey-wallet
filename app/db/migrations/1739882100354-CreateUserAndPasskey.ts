import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateUserAndPasskey1739882100354 implements MigrationInterface {
    name = 'CreateUserAndPasskey1739882100354'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "user" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "username" character varying NOT NULL, "email" character varying NOT NULL, "organizationId" character varying NOT NULL, "organizationName" character varying, "userId" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_78a916df40e02a9deb1c4b75edb" UNIQUE ("username"), CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "passkey" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "challenge" character varying NOT NULL, "attestation" json NOT NULL, "userId" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_783e2060d8025abd6a6ca45d2c7" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "passkey" ADD CONSTRAINT "FK_c36f303905314ea9ead857b6268" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`CREATE TABLE "query-result-cache" ("id" SERIAL NOT NULL, "identifier" character varying, "time" bigint NOT NULL, "duration" integer NOT NULL, "query" text NOT NULL, "result" text NOT NULL, CONSTRAINT "PK_6a98f758d8bfd010e7e10ffd3d3" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "query-result-cache"`);
        await queryRunner.query(`ALTER TABLE "passkey" DROP CONSTRAINT "FK_c36f303905314ea9ead857b6268"`);
        await queryRunner.query(`DROP TABLE "passkey"`);
        await queryRunner.query(`DROP TABLE "user"`);
    }

}
