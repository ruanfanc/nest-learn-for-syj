import { Controller, Get, Post, Body, Patch, Param, Delete, Session } from '@nestjs/common';
import { CasesService } from './cases.service';
import { SubmitCaseDto } from './dto/create-case.dto';
import { AuditCaseDto, CaseListDto, UpdateCaseDto } from './dto/update-case.dto';

@Controller('cases')
export class CasesController {
  constructor(private readonly casesService: CasesService) {}

  @Post('/submit')
  submit(@Body() createCaseDto: SubmitCaseDto, @Session() session) {
    return this.casesService.submit(createCaseDto, session);
  }

  @Get('/detail:id')
  detail(@Param('id') id: string) {
    return this.casesService.detail(id);
  }

  @Post('/audit')
  audit(@Body() auditBody: AuditCaseDto) {
    return this.casesService.audit(auditBody);
  }

  @Post('list')
  list(listBody: CaseListDto) {
    return this.casesService.findAll(listBody);
  }
}
