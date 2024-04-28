import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Session,
  Query,
} from '@nestjs/common';
import { CasesService } from './cases.service';
import { EditCaseDto } from './dto/create-case.dto';
import { AuditCaseDto, CaseListDto } from './dto/update-case.dto';

@Controller('cases')
export class CasesController {
  constructor(private readonly casesService: CasesService) {}

  @Post('/edit')
  editCase(@Body() editCaseDto: EditCaseDto, @Session() session) {
    return this.casesService.editCase(editCaseDto, session);
  }

  @Get('/detail')
  detail(@Query('id') id: string) {
    return this.casesService.detail(id);
  }

  @Post('/audit')
  audit(@Body() auditBody: AuditCaseDto, @Session() session) {
    return this.casesService.audit(auditBody, session);
  }

  @Post('/list')
  list(@Body() listBody: CaseListDto) {
    return this.casesService.findAll(listBody);
  }
}
