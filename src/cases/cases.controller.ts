import { Controller, Get, Post, Body, Session, Query } from '@nestjs/common';
import { CasesService } from './cases.service';
import { EditCaseDto } from './dto/create-case.dto';
import {
  AgreeHandlepCaseDto,
  AuditCaseDto,
  CaseListDto,
  DeleteDto,
  HandlepCaseDto,
  ReEntrustCaseDto,
} from './dto/update-case.dto';

@Controller('cases')
export class CasesController {
  constructor(private readonly casesService: CasesService) {}

  @Post('/edit')
  editCase(@Body() editCaseDto: EditCaseDto, @Session() session) {
    return this.casesService.editCase(editCaseDto, session);
  }

  @Get('/detail')
  detail(@Query('id') id: string, @Session() session) {
    return this.casesService.detail(id, session);
  }

  @Post('/delete')
  delete(@Body() { id }: DeleteDto, @Session() session) {
    return this.casesService.delete({ id }, session);
  }

  @Post('/audit')
  audit(@Body() auditBody: AuditCaseDto, @Session() session) {
    return this.casesService.audit(auditBody, session);
  }

  @Post('/handle')
  handle(@Body() body: HandlepCaseDto, @Session() session) {
    return this.casesService.handle(body, session);
  }

  @Post('/agreeHandle')
  agreeHandle(@Body() body: AgreeHandlepCaseDto, @Session() session) {
    return this.casesService.agreeHandle(body, session);
  }

  @Post('/reEntrustGroup')
  reEntrustGroup(@Body() body: ReEntrustCaseDto, @Session() session) {
    return this.casesService.reEntrustGroup(body, session);
  }

  @Post('/list')
  list(@Body() listBody: CaseListDto, @Session() session) {
    return this.casesService.findAll(listBody, session);
  }
}
