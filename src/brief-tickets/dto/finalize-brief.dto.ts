import { Transform, Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from "class-validator";
import { MAX_REQUIREMENTS_LENGTH } from "../brief-tickets.constants";
import { ClarificationAnswerDto } from "./clarification-answer.dto";

export class FinalizeBriefDto {
  @Transform(({ value }) =>
    typeof value === "string" ? value.trim() : value,
  )
  @IsString()
  @MinLength(1, { message: "requirements must not be empty" })
  @MaxLength(MAX_REQUIREMENTS_LENGTH)
  requirements!: string;

  @IsArray()
  @ArrayMinSize(1, { message: "clarificationAnswers must include at least one item" })
  @ValidateNested({ each: true })
  @Type(() => ClarificationAnswerDto)
  clarificationAnswers!: ClarificationAnswerDto[];
}
