import { PartialType } from "@nestjs/swagger";
import { RegisterDto } from "./register.dto";

export class UpdateDto extends PartialType(RegisterDto) { }