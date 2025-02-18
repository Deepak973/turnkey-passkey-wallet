import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";

@Entity()
export class Passkey {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  challenge: string;

  @Column("json")
  attestation: object;

  @Column()
  userId: string;

  @ManyToOne("User", "passkeys")
  @JoinColumn({ name: "userId" })
  user: any;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
