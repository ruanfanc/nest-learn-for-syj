import { Controller, Get, Post, Body, Patch, Param, Delete, Session } from '@nestjs/common';
import { CasesService } from './cases.service';
import { SubmitCaseDto } from './dto/create-case.dto';
import { UpdateCaseDto } from './dto/update-case.dto';

@Controller('cases')
export class CasesController {
  constructor(private readonly casesService: CasesService) {}

  @Post('/submit')
  submit(@Body() createCaseDto: SubmitCaseDto, @Session() session) {
    return this.casesService.submit(createCaseDto, session);
  }

  @Get()
  findAll() {
    return this.casesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.casesService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCaseDto: UpdateCaseDto) {
    return this.casesService.update(+id, updateCaseDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.casesService.remove(+id);
  }
}
