import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1732400000000 implements MigrationInterface {
  name = 'InitialSchema1732400000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "users_role_enum" AS ENUM ('STUDENT', 'OTHER')`,
    );
    await queryRunner.query(
      `CREATE TYPE "group_members_role_enum" AS ENUM ('LEADER', 'MEMBER')`,
    );
    await queryRunner.query(
      `CREATE TYPE "join_requests_status_enum" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED')`,
    );

    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "usos_id" integer NOT NULL UNIQUE,
        "first_name" varchar(100) NOT NULL,
        "last_name" varchar(100) NOT NULL,
        "student_number" varchar(32),
        "email" varchar(255),
        "role" "users_role_enum" NOT NULL DEFAULT 'OTHER',
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "groups" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" varchar(100) NOT NULL,
        "description" text NOT NULL,
        "leader_id" uuid NOT NULL,
        "member_count" smallint NOT NULL DEFAULT 1,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "CHK_groups_member_count" CHECK ("member_count" >= 1 AND "member_count" <= 6),
        CONSTRAINT "FK_groups_leader" FOREIGN KEY ("leader_id") REFERENCES "users"("id") ON DELETE RESTRICT
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "group_members" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "group_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "role" "group_members_role_enum" NOT NULL,
        "joined_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "FK_group_members_group" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_group_members_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_group_members_user" ON "group_members" ("user_id")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_group_members_group_user" ON "group_members" ("group_id", "user_id")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_group_members_leader" ON "group_members" ("group_id") WHERE "role" = 'LEADER'`,
    );

    await queryRunner.query(`
      CREATE TABLE "join_requests" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "group_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "status" "join_requests_status_enum" NOT NULL DEFAULT 'PENDING',
        "decided_by" uuid,
        "decided_at" timestamptz,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "FK_join_requests_group" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_join_requests_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_join_requests_decided_by" FOREIGN KEY ("decided_by") REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_join_requests_pending" ON "join_requests" ("user_id", "group_id") WHERE "status" = 'PENDING'`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_join_requests_group_status" ON "join_requests" ("group_id", "status")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_join_requests_user_status" ON "join_requests" ("user_id", "status")`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "join_requests"`);
    await queryRunner.query(`DROP TABLE "group_members"`);
    await queryRunner.query(`DROP TABLE "groups"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TYPE "join_requests_status_enum"`);
    await queryRunner.query(`DROP TYPE "group_members_role_enum"`);
    await queryRunner.query(`DROP TYPE "users_role_enum"`);
  }
}
