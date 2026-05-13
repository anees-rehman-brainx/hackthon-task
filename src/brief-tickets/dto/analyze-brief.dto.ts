import { Transform } from "class-transformer";
import { IsString, MaxLength, MinLength } from "class-validator";
import { MAX_REQUIREMENTS_LENGTH } from "../brief-tickets.constants";

export class AnalyzeBriefDto {
  @Transform(({ value }) =>
    typeof value === "string" ? value.trim() : value,
  )
  @IsString()
  @MinLength(1, { message: "requirements must not be empty" })
  @MaxLength(MAX_REQUIREMENTS_LENGTH)
  requirements!: string;
}
