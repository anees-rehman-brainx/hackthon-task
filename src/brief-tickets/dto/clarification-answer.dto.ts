import { Transform } from "class-transformer";
import { IsString, MaxLength, MinLength } from "class-validator";
import { MAX_ANSWER_LENGTH } from "../brief-tickets.constants";

export class ClarificationAnswerDto {
  @Transform(({ value }) =>
    typeof value === "string" ? value.trim() : value,
  )
  @IsString()
  @MinLength(1, { message: "questionId must not be empty" })
  @MaxLength(120)
  questionId!: string;

  @Transform(({ value }) =>
    typeof value === "string" ? value.trim() : value,
  )
  @IsString()
  @MinLength(1, { message: "answer must not be empty" })
  @MaxLength(MAX_ANSWER_LENGTH)
  answer!: string;
}
