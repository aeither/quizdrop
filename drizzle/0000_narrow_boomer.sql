CREATE TABLE "quiz_questions" (
	"id" serial PRIMARY KEY NOT NULL,
	"quiz_id" integer NOT NULL,
	"question" text NOT NULL,
	"options" text[] NOT NULL,
	"correct_idx" integer NOT NULL,
	"explanation" text
);
--> statement-breakpoint
CREATE TABLE "quizzes" (
	"id" serial PRIMARY KEY NOT NULL,
	"coin_address" varchar(42) NOT NULL,
	"tx_hash" varchar(66) NOT NULL,
	"name" varchar(100) NOT NULL,
	"symbol" varchar(10) NOT NULL,
	"description" text,
	"creator_address" varchar(42) NOT NULL,
	"creator_fid" bigint,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "quizzes_coin_address_unique" UNIQUE("coin_address")
);
--> statement-breakpoint
ALTER TABLE "quiz_questions" ADD CONSTRAINT "quiz_questions_quiz_id_quizzes_id_fk" FOREIGN KEY ("quiz_id") REFERENCES "public"."quizzes"("id") ON DELETE cascade ON UPDATE no action;