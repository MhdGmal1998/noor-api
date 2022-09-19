import { MigrationInterface, QueryRunner } from "typeorm"

export class myMigration1663618308081 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE wallet ADD COLUMN typeWallet enum("SALE","GIFT") NOT NULL DEFAULT "SALE" `);

    }

    public async down(queryRunner: QueryRunner): Promise<void> {
    }

}
