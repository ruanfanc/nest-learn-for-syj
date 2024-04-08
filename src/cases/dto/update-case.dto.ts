import { PartialType } from '@nestjs/mapped-types';
import { SubmitCaseDto } from './create-case.dto';

export class UpdateCaseDto extends PartialType(SubmitCaseDto) {}
